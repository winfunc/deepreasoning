use super::*;
use crate::{
    config::Config,
    handlers::{handle_chat, AppState},
};
use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::post,
    Json, Router,
};
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc, Mutex,
};

#[derive(Clone)]
struct Record {
    path: String,
    headers: HeaderMap,
    body: Value,
}

#[derive(Clone, Default)]
struct Service {
    records: Arc<Mutex<Vec<Record>>>,
    behavior: Arc<AtomicUsize>,
}

struct Fixture {
    base: String,
    service: Service,
    task: tokio::task::JoinHandle<()>,
}
impl Drop for Fixture {
    fn drop(&mut self) {
        self.task.abort();
    }
}

async fn fixture() -> Fixture {
    let service = Service::default();
    let router = Router::new()
        .route("/mcp", post(mcp).delete(mcp_delete))
        .route("/deepseek", post(deepseek))
        .route("/anthropic", post(anthropic))
        .with_state(service.clone());
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let base = format!("http://{}", listener.local_addr().unwrap());
    let task = tokio::spawn(async move {
        axum::serve(listener, router).await.unwrap();
    });
    Fixture {
        base,
        service,
        task,
    }
}

fn record(service: &Service, path: &str, headers: HeaderMap, body: &Value) {
    service.records.lock().unwrap().push(Record {
        path: path.to_string(),
        headers,
        body: body.clone(),
    });
}

async fn mcp(
    State(s): State<Service>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> axum::response::Response {
    record(&s, "mcp", headers, &body);
    let method = body["method"].as_str().unwrap();
    let behavior = s.behavior.load(Ordering::SeqCst);
    if method == "notifications/initialized" || method == "notifications/cancelled" {
        return StatusCode::ACCEPTED.into_response();
    }
    let result = match method {
        "initialize" => {
            json!({"protocolVersion":if behavior == 12 { "unsupported" } else { PROTOCOL }, "capabilities":{"tools":{}}, "serverInfo":{"name":"fixture", "version":"1"}})
        }
        "tools/list" => json!({"tools":[{"name":"web_search"}, {"name":"web_fetch"}]}),
        "tools/call" => {
            match behavior {
                1 => return Json(json!({"jsonrpc":"2.0", "id":body["id"], "result":{"isError":true,"content":[{"type":"text","text":"quota fixture"}]}})).into_response(),
                2 => return StatusCode::TOO_MANY_REQUESTS.into_response(),
                3 => tokio::time::sleep(Duration::from_secs(2)).await,
                4 => return "not JSON".into_response(),
                7 => return Json(json!({"jsonrpc":"2.0","id":99,"result":{}})).into_response(),
                8 => return Json(json!({"jsonrpc":"2.0","id":body["id"],"error":{"code":-1,"message":"fixture error"}})).into_response(),
                _ => ()
            }
            let text = if behavior == 6 {
                format!("https://example.com/evidence {}", "é".repeat(30_000))
            } else {
                "Evidence marker: Rust release notes. Source: https://example.com/evidence"
                    .to_string()
            };
            json!({"content":[{"type":"text", "text":text}], "isError":false})
        }
        _ => panic!("unexpected method"),
    };
    let reply = json!({"jsonrpc":"2.0", "id":body["id"], "result":result});
    let mut response = if behavior == 11 && method == "initialize" {
        "malformed handshake".into_response()
    } else if behavior == 5 {
        ([("content-type", "text/event-stream")], format!("event: message\r\ndata: {{\"jsonrpc\":\"2.0\",\"method\":\"notifications/message\"}}\r\n\r\nevent: message\r\ndata: {reply}\r\n\r\n")).into_response()
    } else {
        Json(reply).into_response()
    };
    if method == "initialize" {
        response
            .headers_mut()
            .insert("Mcp-Session-Id", "fixture-session".parse().unwrap());
    }
    response
}

async fn mcp_delete(State(s): State<Service>, headers: HeaderMap) -> StatusCode {
    record(&s, "mcp_delete", headers, &Value::Null);
    match s.behavior.load(Ordering::SeqCst) {
        9 => StatusCode::METHOD_NOT_ALLOWED,
        10 => {
            tokio::time::sleep(Duration::from_secs(2)).await;
            StatusCode::OK
        }
        _ => StatusCode::OK,
    }
}

fn deepseek_reply(stream: bool) -> Value {
    let usage = json!({"prompt_tokens":10,"completion_tokens":5,"total_tokens":15,"prompt_tokens_details":{"cached_tokens":0},"completion_tokens_details":{"reasoning_tokens":5},"prompt_cache_hit_tokens":0,"prompt_cache_miss_tokens":10});
    let choice = if stream {
        json!({"index":0,"delta":{"role":"assistant","reasoning_content":"Grounded reasoning","content":null},"logprobs":null,"finish_reason":null})
    } else {
        json!({"index":0,"message":{"role":"assistant","reasoning_content":"Grounded reasoning","content":""},"logprobs":null,"finish_reason":"stop"})
    };
    json!({"id":"fixture", "object":"chat.completion", "created":1, "model":"deepseek-reasoner", "choices":[choice],"usage":usage,"system_fingerprint":"fixture"})
}

async fn deepseek(
    State(s): State<Service>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> axum::response::Response {
    record(&s, "deepseek", headers, &body);
    let stream = body["stream"] == true;
    let reply = deepseek_reply(stream);
    if stream {
        (
            [("content-type", "text/event-stream")],
            format!("data: {reply}\n\n"),
        )
            .into_response()
    } else {
        Json(reply).into_response()
    }
}

async fn anthropic(
    State(s): State<Service>,
    headers: HeaderMap,
    Json(body): Json<Value>,
) -> axum::response::Response {
    record(&s, "anthropic", headers, &body);
    let grounded = body["messages"]
        .as_array()
        .unwrap()
        .iter()
        .any(|m| m["content"].as_str().unwrap().contains("<web_evidence>"));
    let text = if grounded {
        "A grounded answer [source](https://example.com/evidence)"
    } else {
        "An ordinary answer"
    };
    let usage = json!({"input_tokens":10,"output_tokens":5,"cache_creation_input_tokens":0,"cache_read_input_tokens":0});
    if body["stream"] == true {
        let delta = json!({"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":text}});
        let end = json!({"type":"message_delta","delta":{"stop_reason":"end_turn","stop_sequence":null},"usage":usage});
        ([("content-type","text/event-stream")], format!("event: content_block_delta\ndata: {delta}\n\nevent: message_delta\ndata: {end}\n\nevent: message_stop\ndata: {{\"type\":\"message_stop\"}}\n\n")).into_response()
    } else {
        Json(json!({"id":"fixture","type":"message","role":"assistant","model":"claude-custom","content":[{"type":"text","text":text}],"stop_reason":"end_turn","stop_sequence":null,"usage":usage})).into_response()
    }
}

fn input(stream: bool, context: Value) -> ApiRequest {
    serde_json::from_value(json!({"stream":stream, "system":"Preserved system", "messages":[{"role":"user","content":"User request remains"}],
        "web_context":context, "deepseek_config":{"body":{"model":"saved-reasoner"},"headers":{"x-saved":"deepseek"}},
        "anthropic_config":{"body":{"model":"saved-claude"},"headers":{"x-saved":"anthropic"}}})).unwrap()
}

fn search() -> Value {
    json!({"type":"search", "objective":"Find current Rust release notes", "search_queries":["Rust stable release notes"]})
}
fn fetch() -> Value {
    json!({"type":"fetch", "urls":["https://example.com/evidence"], "objective":"Read release notes"})
}

fn state(f: &Fixture) -> AppState {
    let mut state = AppState::new(Config::default()).unwrap();
    state.web_client.endpoint = format!("{}/mcp", f.base);
    state.model_endpoints = Some((
        format!("{}/deepseek", f.base),
        format!("{}/anthropic", f.base),
    ));
    state
}

fn tokens() -> HeaderMap {
    let mut headers = HeaderMap::new();
    headers.insert(
        "X-DeepSeek-API-Token",
        "deepseek-fixture-token".parse().unwrap(),
    );
    headers.insert(
        "X-Anthropic-API-Token",
        "anthropic-fixture-token".parse().unwrap(),
    );
    headers
}

async fn run(state: AppState, request: ApiRequest) -> Result<String> {
    run_shared(Arc::new(state), request).await
}

async fn run_shared(state: Arc<AppState>, request: ApiRequest) -> Result<String> {
    let response = handle_chat(State(state), tokens(), Json(request)).await?;
    let bytes = axum::body::to_bytes(response.into_body(), 1_000_000)
        .await
        .unwrap();
    Ok(String::from_utf8(bytes.to_vec()).unwrap())
}

#[tokio::test]
async fn actual_chat_handlers_ground_both_models_for_search_and_fetch() {
    for stream in [false, true] {
        for context in [search(), fetch()] {
            let f = fixture().await;
            let answer = run(state(&f), input(stream, context)).await.unwrap();
            assert!(answer.contains("A grounded answer"), "{answer}");
            assert!(answer.contains("https://example.com/evidence"));
            let records = f.service.records.lock().unwrap();
            let mcp: Vec<_> = records.iter().filter(|r| r.path == "mcp").collect();
            assert_eq!(mcp.len(), 4);
            let deletion = records.iter().find(|r| r.path == "mcp_delete").unwrap();
            assert_eq!(deletion.headers["mcp-session-id"], "fixture-session");
            assert_eq!(deletion.headers["user-agent"], USER_AGENT);
            for (i, r) in mcp.iter().enumerate() {
                assert_eq!(r.headers["user-agent"], USER_AGENT);
                assert_eq!(r.headers["mcp-protocol-version"], PROTOCOL);
                assert!(!r.headers.contains_key("authorization"));
                assert!(!r.headers.contains_key("x-api-key"));
                assert!(!r.headers.contains_key("x-saved"));
                assert!(!r.body.to_string().contains("fixture-token"));
                assert!(!r.body.to_string().contains("Preserved system"));
                assert!(!r.body.to_string().contains("User request remains"));
                if i > 0 {
                    assert_eq!(r.headers["mcp-session-id"], "fixture-session");
                }
            }
            assert!(Uuid::parse_str(
                mcp[3].body["params"]["arguments"]["session_id"]
                    .as_str()
                    .unwrap()
            )
            .is_ok());
            for provider in ["deepseek", "anthropic"] {
                let record = records.iter().find(|r| r.path == provider).unwrap();
                let content = record.body["messages"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .find(|m| m["role"] == "user")
                    .unwrap()["content"]
                    .as_str()
                    .unwrap();
                assert!(content.starts_with("User request remains"));
                assert!(content.contains("Evidence marker"));
                assert!(content.contains("https://example.com/evidence"));
                assert_eq!(record.headers["x-saved"], provider);
                assert_eq!(
                    record.body["model"],
                    if provider == "deepseek" {
                        "saved-reasoner"
                    } else {
                        "saved-claude"
                    }
                );
            }
        }
    }
}

#[tokio::test]
async fn omitted_or_null_context_preserves_ordinary_chat_even_when_permission_disabled() {
    assert_eq!(ParallelClient::new().unwrap().endpoint, ENDPOINT);
    for stream in [false, true] {
        let f = fixture().await;
        let mut state = state(&f);
        state.config.server.allow_web_context = false;
        let mut value = serde_json::to_value(input(stream, Value::Null)).unwrap();
        value.as_object_mut().unwrap().remove("web_context");
        let answer = run(state, serde_json::from_value(value).unwrap())
            .await
            .unwrap();
        assert!(answer.contains("An ordinary answer"));
        assert!(f
            .service
            .records
            .lock()
            .unwrap()
            .iter()
            .all(|r| r.path != "mcp"));
    }
}

#[tokio::test]
async fn permission_and_invalid_requests_do_not_contact_any_provider() {
    let f = fixture().await;
    let mut denied = state(&f);
    denied.config.server.allow_web_context = false;
    assert!(matches!(
        run(denied, input(false, search())).await,
        Err(ApiError::BadRequest { .. })
    ));
    for context in [
        json!({"type":"search","objective":"", "search_queries":[]}),
        json!({"type":"fetch", "urls":["file:///etc/passwd"]}),
        json!({"type":"fetch", "urls":["https://user:password@example.com"]}),
        json!({"type":"fetch", "urls":[]}),
    ] {
        assert!(matches!(
            run(state(&f), input(false, context)).await,
            Err(ApiError::BadRequest { .. })
        ));
    }
    let mut request = input(false, search());
    request.messages.clear();
    assert!(matches!(
        run(state(&f), request).await,
        Err(ApiError::BadRequest { .. })
    ));
    assert!(f.service.records.lock().unwrap().is_empty());
}

#[tokio::test]
async fn provider_and_protocol_errors_stop_both_handlers_without_inference() {
    for stream in [false, true] {
        for behavior in [1, 2, 4, 7, 8] {
            let f = fixture().await;
            f.service.behavior.store(behavior, Ordering::SeqCst);
            let error = run(state(&f), input(stream, search())).await.unwrap_err();
            assert!(matches!(error, ApiError::WebContext { .. }));
            assert_eq!(error.into_response().status(), StatusCode::BAD_GATEWAY);
            assert!(f
                .service
                .records
                .lock()
                .unwrap()
                .iter()
                .all(|r| r.path.starts_with("mcp")));
            assert!(f
                .service
                .records
                .lock()
                .unwrap()
                .iter()
                .any(|r| r.path == "mcp_delete"));
        }
    }
}

#[tokio::test]
async fn timeout_and_caller_cancellation_stop_before_model_inference() {
    for stream in [false, true] {
        let f = fixture().await;
        f.service.behavior.store(3, Ordering::SeqCst);
        let mut state = state(&f);
        state.web_client.timeout = Duration::from_millis(100);
        assert!(run(state, input(stream, search()))
            .await
            .unwrap_err()
            .to_string()
            .contains("timed out"));
        assert!(f
            .service
            .records
            .lock()
            .unwrap()
            .iter()
            .all(|r| r.path.starts_with("mcp")));
        wait_for_deletions(&f, 1).await;
        let state = super::tests::state(&f);
        assert!(tokio::time::timeout(
            Duration::from_millis(100),
            run(state, input(stream, fetch()))
        )
        .await
        .is_err());
        assert!(f
            .service
            .records
            .lock()
            .unwrap()
            .iter()
            .all(|r| r.path.starts_with("mcp")));
        wait_for_deletions(&f, 2).await;
        let records = f.service.records.lock().unwrap();
        let cancels: Vec<_> = records
            .iter()
            .filter(|r| r.body["method"] == "notifications/cancelled")
            .collect();
        assert_eq!(cancels.len(), 2);
        assert!(cancels.iter().all(|r| r.body["params"]["requestId"] == 3));
    }
}

async fn wait_for_deletions(f: &Fixture, count: usize) {
    tokio::time::timeout(Duration::from_secs(1), async {
        loop {
            if f.service
                .records
                .lock()
                .unwrap()
                .iter()
                .filter(|r| r.path == "mcp_delete")
                .count()
                >= count
            {
                break;
            }
            tokio::time::sleep(Duration::from_millis(5)).await;
        }
    })
    .await
    .expect("bounded cleanup must terminate the session");
}

#[tokio::test]
async fn failed_handshakes_terminate_sessions_received_in_response_headers() {
    for behavior in [11, 12] {
        let f = fixture().await;
        f.service.behavior.store(behavior, Ordering::SeqCst);
        assert!(run(state(&f), input(false, search())).await.is_err());
        wait_for_deletions(&f, 1).await;
        assert!(f
            .service
            .records
            .lock()
            .unwrap()
            .iter()
            .all(|r| r.path.starts_with("mcp")));
    }
}

#[tokio::test]
async fn unsupported_or_slow_session_cleanup_preserves_successful_retrieval() {
    for behavior in [9, 10] {
        let f = fixture().await;
        f.service.behavior.store(behavior, Ordering::SeqCst);
        let answer = tokio::time::timeout(
            Duration::from_secs(1),
            run(state(&f), input(false, search())),
        )
        .await
        .unwrap()
        .unwrap();
        assert!(answer.contains("A grounded answer"));
        wait_for_deletions(&f, 1).await;
    }
}

#[tokio::test]
async fn sse_transport_and_unicode_context_bound_work_through_chat() {
    for behavior in [5, 6] {
        let f = fixture().await;
        f.service.behavior.store(behavior, Ordering::SeqCst);
        assert!(run(state(&f), input(false, search()))
            .await
            .unwrap()
            .contains("A grounded answer"));
        let records = f.service.records.lock().unwrap();
        let request = &records.iter().find(|r| r.path == "deepseek").unwrap().body;
        let content = request["messages"][1]["content"].as_str().unwrap();
        let evidence = content
            .split("<web_evidence>\n")
            .nth(1)
            .unwrap()
            .split("\n</web_evidence>")
            .next()
            .unwrap();
        assert!(evidence.chars().count() <= MAX_CONTEXT_CHARS);
    }
}

#[tokio::test]
async fn existing_server_config_retains_explicit_web_context_permission() {
    let config: Config = config::Config::builder()
        .add_source(config::File::from_str(
            include_str!("../../config.toml")
                .replace("allow_web_context = true", "")
                .as_str(),
            config::FileFormat::Toml,
        ))
        .build()
        .unwrap()
        .try_deserialize()
        .unwrap();
    assert!(config.server.allow_web_context);
}

#[tokio::test]
async fn conversation_ids_survive_related_calls_interleaving_and_quota_retries() {
    let f = fixture().await;
    let shared = Arc::new(state(&f));
    let first = Uuid::new_v4();
    let second = Uuid::new_v4();
    let with_id = |mut context: Value, id: Uuid| {
        context["session_id"] = json!(id);
        input(false, context)
    };
    // Two caller-owned conversations use one cached HTTP client concurrently.
    let (a, b) = tokio::join!(
        run_shared(shared.clone(), with_id(search(), first)),
        run_shared(shared.clone(), with_id(search(), second))
    );
    a.unwrap();
    b.unwrap();
    let (a, b) = tokio::join!(
        run_shared(shared.clone(), with_id(fetch(), first)),
        run_shared(shared.clone(), with_id(fetch(), second))
    );
    a.unwrap();
    b.unwrap();
    // An explicit quota error must not cause a new identity on caller retry.
    f.service.behavior.store(1, Ordering::SeqCst);
    assert!(run_shared(shared.clone(), with_id(search(), first))
        .await
        .is_err());
    f.service.behavior.store(0, Ordering::SeqCst);
    run_shared(shared.clone(), with_id(search(), first))
        .await
        .unwrap();
    // A reset/new standalone run without a supplied ID generates a fresh UUID
    // in the production resolver, even when the shared client is reused.
    let (a, b) = tokio::join!(
        run_shared(shared.clone(), input(false, search())),
        run_shared(shared, input(false, fetch()))
    );
    a.unwrap();
    b.unwrap();
    let records = f.service.records.lock().unwrap();
    let calls: Vec<_> = records
        .iter()
        .filter(|r| r.path == "mcp" && r.body["method"] == "tools/call")
        .collect();
    assert_eq!(calls.len(), 8);
    let ids: Vec<_> = calls
        .iter()
        .map(|r| {
            r.body["params"]["arguments"]["session_id"]
                .as_str()
                .unwrap()
        })
        .collect();
    assert_eq!(ids.iter().filter(|id| **id == first.to_string()).count(), 4);
    assert_eq!(
        ids.iter().filter(|id| **id == second.to_string()).count(),
        2
    );
    assert_ne!(ids[6], ids[7]);
    for id in &ids[6..] {
        assert_ne!(*id, first.to_string());
        assert_ne!(*id, second.to_string());
    }
}

async fn live(context: Value) {
    let f = fixture().await;
    let mut state = state(&f);
    state.web_client = ParallelClient::new().unwrap();
    let answer = run(state, input(false, context)).await.unwrap();
    assert!(answer.contains("A grounded answer"));
    let records = f.service.records.lock().unwrap();
    for name in ["deepseek", "anthropic"] {
        let body = &records.iter().find(|r| r.path == name).unwrap().body;
        let text = body["messages"]
            .as_array()
            .unwrap()
            .iter()
            .find(|m| m["role"] == "user")
            .unwrap()["content"]
            .as_str()
            .unwrap();
        assert!(text.contains("https://"));
        println!(
            "live {name} consumed {} characters of retrieved context",
            text.chars().count()
        );
    }
}

#[tokio::test]
#[ignore = "Uses the live anonymous Parallel endpoint; model inference stays local"]
async fn live_search_through_chat_handler() {
    live(search()).await;
}

#[tokio::test]
#[ignore = "Uses the live anonymous Parallel endpoint; model inference stays local"]
async fn live_fetch_through_chat_handler() {
    live(json!({"type":"fetch","urls":["https://www.rust-lang.org/"],"objective":"Find the Rust language description"})).await;
}

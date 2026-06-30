import urllib.request
import urllib.parse
import json
import time
import threading
import sys

def main():
    sse_url = 'http://127.0.0.1:3845/mcp'
    print(f"Connecting to SSE endpoint: {sse_url}")
    
    # We will run a thread to read the SSE stream
    # and keep track of the session URL and responses.
    post_url = None
    response_event = threading.Event()
    response_data = None
    
    def read_sse():
        nonlocal post_url, response_data
        try:
            req = urllib.request.Request(sse_url, headers={'Accept': 'text/event-stream'})
            with urllib.request.urlopen(req) as response:
                current_event = None
                for line in response:
                    line = line.decode('utf-8').strip()
                    if not line:
                        continue
                    if line.startswith('event:'):
                        current_event = line[6:].strip()
                    elif line.startswith('data:'):
                        data_str = line[5:].strip()
                        if current_event == 'endpoint':
                            # This is the POST URL
                            # Wait, the data could be a relative or absolute URL.
                            # Usually it is a URL with session_id query param
                            query_params = urllib.parse.urlparse(data_str).query
                            if query_params:
                                post_url = f"http://127.0.0.1:3845/mcp?{query_params}"
                            else:
                                post_url = data_str
                            print(f"Got post URL: {post_url}")
                        elif current_event == 'message':
                            msg = json.loads(data_str)
                            # Print or store message
                            if 'id' in msg and msg['id'] == 1:
                                response_data = msg
                                response_event.set()
                            else:
                                print(f"Received other message: {msg}")
        except Exception as e:
            print(f"Error in SSE reader: {e}", file=sys.stderr)

    t = threading.Thread(target=read_sse)
    t.daemon = True
    t.start()

    # Wait for the post_url to be retrieved
    for _ in range(50):
        if post_url:
            break
        time.sleep(0.1)
    
    if not post_url:
        print("Failed to get post URL from SSE endpoint.")
        return

    # Call tool 'get_design_context'
    # Node ID from URL https://www.figma.com/design/BOtpOsmfcyUZXgedgqlyAQ/...node-id=10-4074
    # The nodeId is "10:4074"
    call_payload = {
        "jsonrpc": "2.0",
        "method": "tools/call",
        "params": {
            "name": "get_design_context",
            "arguments": {
                "nodeId": "10:4074"
            }
        },
        "id": 1
    }
    
    req_data = json.dumps(call_payload).encode('utf-8')
    print("Sending tools/call request...")
    req = urllib.request.Request(
        post_url,
        data=req_data,
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            # The HTTP POST response is usually just "accepted" (200 OK or 202 Accepted)
            # and the actual JSON-RPC response is sent back via the SSE connection.
            print(f"POST response code: {resp.status}")
    except Exception as e:
        print(f"Error sending POST: {e}")
        return

    # Wait for response on SSE
    print("Waiting for response on SSE...")
    if response_event.wait(timeout=10):
        print("Success! Received response:")
        print(json.dumps(response_data, indent=2, ensure_ascii=False))
    else:
        print("Timed out waiting for response.")

if __name__ == '__main__':
    main()

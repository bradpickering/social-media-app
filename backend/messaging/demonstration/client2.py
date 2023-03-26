import requests
def stream():
    s = requests.Session()
    r = s.get('http://localhost/message', stream=True)
    print(r.content)
    for line in r.iter_lines():
        if line:
            print(line)

stream()
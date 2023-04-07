# social-media-app


## How to Run
- In root directory run ```docker-compose up --build```
- In inputs directory run:
   - ```pip install requests``` or ```pip install -r requirements.txt```
   - ```python3 send_inputs.py ./inputs.txt```


### Input file
- Runs all CRUD commands other than sending messages
- messages are working, they're accessed via HTTP and messages are stored in the ```messages.<sender>.to.<recipient>``` key in the redis cache
- Outputs from the ```send_input.py``` will be stored in a file created named ```outputs.txt```, they include the individual reports for each user and all the posts after running all of the inputs

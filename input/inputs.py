import sys
import requests
import json 
url = "http://localhost"

input_file = open(sys.argv[1], 'r')
output_file = open('reports.txt', 'w')
output_file.write("~~~~~~~~~~~~INDIVIDUAL USER REPORTS FROM /user/report~~~~~~~~~~~~~~~~~")
for line in input_file:
    line = line.strip()
    if line.strip() == "":
        continue
    inputs = line.split(',')
    for i, input in enumerate(inputs):
        inputs[i] = input.strip()
    payload = {}
    cmd_type = None

#~~~~~~~~~~~~~~ USER COMMANDS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    if 'new_user' in inputs[0]:
        payload = {'username': inputs[1], 'password': inputs[2], 'email': inputs[3], 'dob': inputs[4]}
        cmd_type = 'post'
    elif 'add_friend' in inputs[0]:
        payload = {'username': inputs[1], 'friendUsername': inputs[2]}
        cmd_type = 'post'
    elif 'report' in inputs[0]:
        payload = {'username': inputs[1]}
        cmd_type = 'post'
# ~~~~~~~~~~~~~ POSTS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    elif '/posts/posts' in inputs[0]:
        cmd_type = 'get'
    elif 'new_post' in inputs[0]:
        payload = {'username': inputs[1], 'postId': inputs[2], 'postTitle': inputs[3], 'postContent': inputs[4]}
        cmd_type = 'post'
    elif 'like_post' in inputs[0]:
        payload = {'author': inputs[1], 'postId': inputs[2], 'likerUsername': inputs[3]}
        cmd_type = 'put'
    elif 'edit_post' in inputs[0]:
        payload = {'username': inputs[1], 'postId': inputs[2], 'newContent': inputs[3]}
        cmd_type = 'put'
    elif 'delete_post' in inputs[0]:
        payload = {'username': inputs[1], 'postId': inputs[2]}
        cmd_type = 'delete'

# ~~~~~~~~~~~~~ COMMENTS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    elif 'new_comment' in inputs[0]:
        payload = {'postAuthor': inputs[1], 'postId': inputs[2], 'commentAuthor': inputs[3], 'commentId': inputs[4], 'commentContent': inputs[5]}
        cmd_type='post'
    elif 'edit_comment' in inputs[0]:
        payload = {'postAuthor': inputs[1], 'postId': inputs[2], 'commentId':inputs[3], 'newContent': inputs[4]}
        cmd_type='put'
    elif 'delete_comment' in inputs[0]:
        payload = {'postAuthor': inputs[1], 'postId': inputs[2], 'commentId': inputs[3], 'commentAuthor': inputs[4]}
        cmd_type = 'delete'
    elif 'like_comment' in inputs[0]:
        payload = {'postAuthor': inputs[1], 'postId': inputs[2], 'commentAuthor': inputs[4], 'commentId': inputs[3], 'likerUsername': inputs[5]}
        cmd_type = 'put'

    if 'report' in inputs[0]:
        report = getattr(requests, cmd_type)(url+inputs[0], json=payload)
        output_file.write(json.dumps(report.json(), indent=4))
    elif '/posts/posts' in inputs[0]:
        all_posts = getattr(requests, cmd_type)(url+inputs[0], json=payload)
        output_file.write("\n\n\n ~~~~~~~~ ALL POSTS FROM /posts/posts ~~~~~~~~\n\n")
        output_file.write(json.dumps(all_posts.json(), indent=4))
    else:
        getattr(requests, cmd_type)(url+inputs[0], json=payload)
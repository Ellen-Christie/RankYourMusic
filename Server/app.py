from flask import Flask, Response, make_response, request, abort, jsonify
from flask_cors import CORS

import os
import googleapiclient.discovery
from googleapiclient.errors import HttpError
app = Flask(__name__)
CORS(app)
# Disable OAuthlib's HTTPS verification when running locally.
# *DO NOT* leave this option enabled in production.
# os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

api_service_name = "youtube"
api_version = "v3"


youtube = googleapiclient.discovery.build(
    api_service_name, api_version, developerKey = os.environ["YOUTUBE_API_KEY"])

@app.route("/getplaylist", methods=["GET"])
def getplaylistitems():
    def id_to_videos(playlist_id):
        def items_to_video_objects(list_of_items):
            return [{"title":item["snippet"]["title"], "videoId": item["contentDetails"]["videoId"]}\
            for item in list_of_items] 
        
        try:
            the_request = youtube.playlistItems().list(
                part="snippet,contentDetails",
                maxResults=50,
                playlistId=playlist_id,
                fields="nextPageToken, items(contentDetails/videoId,snippet/title)")
            the_response = the_request.execute()
        except HttpError as err:
            errargs = err.args[0]
            errcode = errargs['status']

            if (errcode == '404' or errcode == '400'):
                the_response = jsonify({'err':'Playlist Not Found. Is the URL correct?'})
                the_response.status = 400
                abort(the_response)
            elif (errcode == '403'):
                the_response = jsonify({'err':'Playlist not accessable. This app only supports importing public playlists.'})
                the_response.status = 403
                abort(the_response)
            else:
                the_response = jsonify({'err':'Unknown error.'})
                the_response.status = 500
                abort(the_response)
        else:
            list_of_videos = items_to_video_objects(the_response["items"])
            while "nextPageToken" in the_response:
                the_request = youtube.playlistItems().list_next(the_request, the_response)
                the_response = the_request.execute()
                list_of_videos = list_of_videos + items_to_video_objects(the_response["items"])
            return list_of_videos

    playlist_id = request.args.get('playlistID')
    if playlist_id == None:
        abort(400)
    return id_to_videos(playlist_id)
    

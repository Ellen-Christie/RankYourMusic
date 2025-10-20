import os
from flask import Flask, Response, make_response, request, abort, jsonify
from flask_cors import CORS
import googleapiclient.discovery
from googleapiclient.errors import HttpError
from Server.Vendored.bandcamp_api import Bandcamp

app = Flask(__name__)
CORS(app)


api_service_name = "youtube"
api_version = "v3"
youtube = googleapiclient.discovery.build(
    api_service_name, api_version, developerKey=os.environ["YOUTUBE_API_KEY"]
)

bc = Bandcamp()


@app.route("/getplaylist", methods=["GET"])
def getplaylistitems():
    def items_to_video_objects(list_of_items):
        return [
            {
                "type": "youtubeVideo",
                "title": item["snippet"]["title"],
                "videoId": item["contentDetails"]["videoId"],
            }
            for item in list_of_items
        ]

    playlist_id = request.args.get("playlistID")
    if playlist_id is None:
        abort(400)

    try:
        the_request = youtube.playlistItems().list(
            part="snippet,contentDetails",
            maxResults=50,
            playlistId=playlist_id,
            fields="nextPageToken, items(contentDetails/videoId,snippet/title)",
        )
        the_response = the_request.execute()
    except HttpError as err:
        errargs = err.args[0]
        errcode = errargs["status"]

        if errcode == "404" or errcode == "400":
            the_response = jsonify({"err": "Playlist Not Found. Is the URL correct?"})
            the_response.status = 400
            abort(the_response)
        elif errcode == "403":
            the_response = jsonify(
                {
                    "err": "Playlist not accessable. This app only supports importing public playlists."
                }
            )
            the_response.status = 403
            abort(the_response)
        else:
            the_response = jsonify({"err": "Unknown error."})
            the_response.status = 500
            abort(the_response)
    else:
        list_of_videos = items_to_video_objects(the_response["items"])
        while "nextPageToken" in the_response:
            the_request = youtube.playlistItems().list_next(the_request, the_response)
            the_response = the_request.execute()
            list_of_videos = list_of_videos + items_to_video_objects(
                the_response["items"]
            )
        return list_of_videos


@app.route("/getbandcampalbum", methods=["GET"])
def getalbum():
    album_url = request.args.get("albumURL")
    if album_url is None:
        abort(400)
    album = bc.get_album(album_url=album_url)
    if album.album_title == "":
        the_response = jsonify({"err": "Album not found. Is the URL correct?"})
        the_response.status = 400
        abort(the_response)
    return [
        {
            "type": "bandcampTrack",
            "title": x.track_title,
            "artist": x.artist_title,
            "albumID": album.album_id,
            "trackID": x.track_id,
            "albumTitle": album.album_title,
            "albumArt": x.art_url,
        }
        for x in album.tracks
    ]

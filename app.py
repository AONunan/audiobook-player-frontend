from flask import Flask, render_template, url_for, jsonify
import requests

app = Flask(__name__)

@app.route('/')
def index():
  def get_library():
    return requests.get(url='http://192.168.1.2:5200/get_library').json()

  def get_current_track():
    return requests.get(url='http://192.168.1.2:5200/get_current_track').json()

  return render_template(
    'index.html',
    myname="Alan",
    library=get_library(),
    current_track=get_current_track()
  )

@app.route('/test')
def test():
  return "Web app running"



if __name__ == "__main__":
  app.run(debug=True, host= '0.0.0.0', port=5100)



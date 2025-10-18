"use strict";
// Global Vars
let BACKEND_URL = "http://127.0.0.1:5000";
// Datatypes

// Binary tree datatype, which is used for the "insetion sort" implementation
// Not efficient but efficiency doesn't matter here.
const emptyNode = Symbol("emptyNode");

class bTree {
  constructor(entry, left = emptyNode, right = emptyNode) {
    this.entry = entry;
    this.left = left;
    this.right = right;
  }
}

function balancebTree(tree) {
  return listtobTree(bTreetoList(tree));
}
function bTreetoList(tree) {
  if (tree === emptyNode) {
    return [];
  } else {
    return [...bTreetoList(tree.left), tree.entry, ...bTreetoList(tree.right)];
  }
}
//Converts ordered list into a *balanced* bTree
function listtobTree(list) {
  function partialTree(elts, n) {
    if (n === 0) {
      return [emptyNode, elts];
    } else {
      let leftSize = Math.floor((n - 1) / 2);
      let leftResult = partialTree(elts, leftSize);
      let leftTree = leftResult[0];
      let nonLeftElts = leftResult[1];
      let rightSize = n - (leftSize + 1);
      let thisEntry = nonLeftElts[0];
      let rightResult = partialTree(nonLeftElts.slice(1), rightSize);
      let rightTree = rightResult[0];
      let remainingElts = rightResult[1];
      return [new bTree(thisEntry, leftTree, rightTree), remainingElts];
    }
  }
  return partialTree(list, list.length)[0];
}

// Base/abstract classes
// These classes are meant to be inherited from, not used directly.
// These are mainly here to make the api of certain types of data clear.

class abstractSong {
  constructor() {
    // *How* a song is constructed is decided by the implementor
  }
  serializable() {
    // This should return the corresponding serializableSong
    return;
  }
  itemView() {
    // This should return a string of html
    // When rendered it should show an embed of the song and corresponding information
    return;
  }
  listItem() {
    // This should return a string, that displays the song name and (usually) artist
    // This is then used when the ranked list of songs is shown to the user
    return;
  }
}
class serializableSong {
  constructor(type) {
    this.type = type;
  }
}

// Song Classes
class youtubeVideo extends abstractSong {
  #title;
  #videoId;
  constructor({ title, videoId }) {
    super();
    this.#title = title;
    this.#videoId = videoId;
  }
  serializable() {
    return new serializableYoutubeVideo(this.#title, this.#videoId);
  }
  itemView() {
    return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${this.#videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
         <p>${this.#title}</p>`;
  }
  listItem() {
    return this.#title;
  }
}

class serializableYoutubeVideo extends serializableSong {
  constructor(title, videoId) {
    super("youtubeVideo");
    this.title = title;
    this.videoId = videoId;
  }
}

class bandcampTrack extends abstractSong {
  #title;
  #albumTitle;
  #artist;
  #albumID;
  #trackID;
  #albumArt;
  constructor({ title, albumTitle, artist, albumID, trackID, albumArt }) {
    super();
    this.#title = title;
    this.#albumTitle = albumTitle;
    this.#artist = artist;
    this.#albumID = albumID;
    this.#trackID = trackID;
    this.#albumArt = albumArt;
  }
  serializable() {
    return new serializableBandcampTrack({
      title: this.#title,
      albumTitle: this.#albumTitle,
      artist: this.#artist,
      albumID: this.#albumID,
      trackID: this.#trackID,
      albumArt: this.#albumArt,
    });
  }
  itemView() {
    return `<img src=${this.#albumArt}>
    <div>${this.#title}</div>
    <div>${this.#albumTitle}</div>
    <div>${this.#artist}</div>
    <iframe style="border: 0; width: 100%; height: 42px;" src="https://bandcamp.com/EmbeddedPlayer/album=${this.#albumID}/size=small/bgcol=ffffff/linkcol=0687f5/artwork=none/track=${this.#trackID}/transparent=true/" seamless></iframe>`;
  }
  listItem() {
    return `${this.#title} - ${this.#artist}`;
  }
}
class serializableBandcampTrack extends serializableSong {
  constructor({ title, albumTitle, artist, albumID, trackID, albumArt }) {
    super("bandcampTrack");
    this.title = title;
    this.albumTitle = albumTitle;
    this.artist = artist;
    this.albumID = albumID;
    this.trackID = trackID;
    this.albumArt = albumArt;
  }
}
function deserialiseSong(pSong) {
  switch (pSong.type) {
    case "youtubeVideo":
      return new youtubeVideo(pSong);
    case "bandcampTrack":
      return new bandcampTrack(pSong);
    default:
      throw "Unable to deserialize song: Invalid type";
  }
}

class orderResponse {
  constructor(left, right, serialiseResults) {
    this.left = left;
    this.right = right;
    // This should be a function that, when called, returns a json string containing the state needed to restart the generator"
    this.serialiseResults = serialiseResults;
  }
}

class serializableState {
  constructor(type) {
    this.type = type;
  }
}

class serializableBinaryInsertionOrderState extends serializableState {
  constructor(ordered, songsToOrder) {
    super("BinaryInsertionOrder");
    this.ordered = ordered.map((x) => x.serializable());
    this.songsToOrder = songsToOrder.map((x) => x.serializable());
    console.log(this.type);
  }
  static deserialize(serializedOrder) {
    if (serializedOrder.songsToOrder.length == 0) {
      throw "Error: File contains no songs to sort";
    } else {
      return binaryInsertionOrder(
        serializedOrder.songsToOrder.map(deserialiseSong),
        serializedOrder.ordered.map(deserialiseSong),
      );
    }
  }
}

class serializableMergeOrderState extends serializableState {
  constructor(
    array,
    low,
    mid,
    high,
    width,
    copy,
    index,
    leftIndex,
    rightIndex,
  ) {
    super("MergeOrderState");
    this.array = array.map((x) => x.serializable());
    this.low = low;
    this.mid = mid;
    this.high = high;
    this.width = width;
    this.copy = copy.map((x) => x.serializable());
    this.index = index;
    this.leftIndex = leftIndex;
    this.rightIndex = rightIndex;
  }
  static deserialize(serializedOrder) {
    serializedOrder.array = serializedOrder.array.map(deserialiseSong);
    serializedOrder.copy = serializedOrder.copy.map(deserialiseSong);
    return mergeOrder(serializedOrder.array, serializedOrder);
  }
}

function deserilializeGen(order) {
  switch (order.type) {
    case "BinaryInsertionOrder":
      return serializableBinaryInsertionOrderState.deserialize(order);
    case "MergeOrderState":
      return serializableMergeOrderState.deserialize(order);
    default:
      throw "Unable to deserialize order: Invalid type";
  }
}

function* binaryInsertionOrder(toOrder, ordered) {
  function serialize(stateTree, toOrderIndex) {
    let stateList = bTreetoList(stateTree);
    let restToOrder = toOrder.slice(toOrderIndex);
    return () => {
      let orderObject = new serializableBinaryInsertionOrderState(
        stateList,
        restToOrder,
      );
      console.log(orderObject);
      return JSON.stringify(orderObject);
    };
  }
  let state = ordered ? listtobTree(ordered) : new bTree(toOrder[0]);
  if (!ordered) {
    toOrder = toOrder.slice(1);
  }
  console.log(toOrder);
  for (let toInsertIndex in toOrder) {
    let toInsert = toOrder[toInsertIndex];
    function* insert(tree) {
      let betterThan = yield new orderResponse(
        toInsert,
        tree.entry,
        serialize(state, toInsertIndex),
      );
      if (betterThan === true) {
        if (tree.left === emptyNode) {
          tree.left = new bTree(toInsert);
        } else {
          yield* insert(tree.left);
        }
      } else {
        if (tree.right === emptyNode) {
          tree.right = new bTree(toInsert);
        } else {
          yield* insert(tree.right);
        }
      }
    }
    yield* insert(state);
    let temp = balancebTree(state);
    state = temp;
  }
  return bTreetoList(state);
}

function* mergeOrder(toOrder, state) {
  function serialize(
    array,
    i,
    mid,
    high,
    width,
    copy,
    index,
    leftIndex,
    rightIndex,
  ) {
    return () => {
      let orderObject = new serializableMergeOrderState(
        array,
        i,
        mid,
        high,
        width,
        copy,
        index,
        leftIndex,
        rightIndex,
      );
      return JSON.stringify(orderObject);
    };
  }
  function* merge(
    array,
    low,
    mid,
    high,
    width,
    copy2,
    index2,
    leftIndex,
    rightIndex,
  ) {
    let copy = copy2 ? copy2 : [...array];
    let leftListIndex = leftIndex ? leftIndex : low;
    let rightListIndex = rightIndex ? rightIndex : mid + 1;
    let index = index2 ? index2 : low;
    for (index; index <= high; index++) {
      if (leftListIndex > mid) {
        array[index] = copy[rightListIndex];
        rightListIndex++;
      } else if (rightListIndex > high) {
        array[index] = copy[leftListIndex];
        leftListIndex++;
      } else {
        let [x, y] = [copy[leftListIndex], copy[rightListIndex]];
        let leftBetterThanRight = yield new orderResponse(
          x,
          y,
          serialize(
            array,
            low,
            mid,
            high,
            width,
            copy,
            index,
            leftListIndex,
            rightListIndex,
          ),
        );
        if (leftBetterThanRight) {
          array[index] = x;
          leftListIndex++;
        } else {
          array[index] = y;
          rightListIndex++;
        }
      }
    }
  }
  if (!state) {
    let listLength = toOrder.length;
    for (let width = 1; width < listLength; width = width * 2) {
      for (let i = 0; i < listLength - width; i += width * 2) {
        yield* merge(
          toOrder,
          i,
          i + width - 1,
          Math.min(i + width * 2 - 1, listLength - 1),
          width,
        );
      }
    }
    return toOrder;
  } else {
    let { array, i, mid, high, width, copy, index, leftIndex, rightIndex } =
      state;
    yield* merge(
      array,
      i,
      mid,
      high,
      width,
      copy,
      index,
      leftIndex,
      rightIndex,
    );
    let listLength = array.length;
    i = i + width * 2;
    for (i; i < listLength - width; i += width * 2) {
      yield* merge(
        array,
        i,
        i + width - 1,
        Math.min(i + width * 2 - 1, listLength - 1),
        width,
      );
    }
    width = width * 2;
    for (width; width < listLength; width = width * 2) {
      for (let i = 0; i < listLength - width; i += width * 2) {
        yield* merge(
          array,
          i,
          i + width - 1,
          Math.min(i + width * 2 - 1, listLength - 1),
          width,
        );
      }
    }
    console.log(array);
    return array;
  }
}

function createGen(songList) {
  if (songList.length < 2) {
    throw "Error: Need a list of at least 2 songs";
  }
  const algorithmSelection = document.querySelector("#sortingAlgorithm").value;
  const gen =
    algorithmSelection === "binaryInsertionSort"
      ? binaryInsertionOrder(songList)
      : algorithmSelection === "mergeSort"
        ? mergeOrder(songList)
        : console.error("what");
  return gen;
}
document.addEventListener("DOMContentLoaded", () => {
  function main(gen) {
    function save(jsonString) {
      console.log(jsonString);
      const blob = new Blob([jsonString], { type: "text/json" });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = blobUrl;
      link.download = "rank.json";
      document.body.appendChild(link);

      link.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          view: window,
        }),
      );
      document.body.removeChild(link);
    }
    function onclick(betterThan) {
      // We do a deep copy of the save button element to remove it's event listeners
      // The alternitive is passing lambdas around, which, considering how the code is structured, would be a pain.
      let element = document.querySelector("#serialize");
      let newElement = element.cloneNode(true);
      element.parentNode.replaceChild(newElement, element);

      genResult = gen.next(betterThan);
      if (genResult.done) {
        onFinish(genResult.value);
        return;
      } else {
        let { left, right, serialiseResults } = genResult.value;

        document
          .querySelector("#serialize")
          .addEventListener("click", () => save(serialiseResults()));
        document.querySelector("#left").innerHTML = left.itemView();
        document.querySelector("#right").innerHTML = right.itemView();
      }
    }

    function onFinish(finalState) {
      document.querySelector("#leftButton").disabled = true;
      document.querySelector("#rightButton").disabled = true;
      document.querySelector("#serialize").disabled = true;

      for (let item of finalState) {
        let listElement = document.createElement("li");
        listElement.innerHTML = item.listItem();
        document.querySelector("#results").appendChild(listElement);
      }

      let { left, right, serialiseResults } = genResult.value;
      document.querySelector("#left").innerHTML = left.itemView();
      document.querySelector("#right").innerHTML = right.itemView();
    }

    document.querySelector("#leftButton").disabled = false;
    document.querySelector("#rightButton").disabled = false;
    document.querySelector("#serialize").disabled = false;
    document.querySelector("#sortingAlgorithm").disabled = true;
    document.querySelector("#playlistUrl").disabled = true;
    document.querySelector("#playlistUrlButton").disabled = true;
    document.querySelector("#deserialize").disabled = true;

    let genResult = gen.next();
    let { left, right, serialiseResults } = genResult.value;
    document
      .querySelector("#serialize")
      .addEventListener("click", () => save(serialiseResults()));
    document.querySelector("#left").innerHTML = left.itemView();
    document.querySelector("#right").innerHTML = right.itemView();

    document
      .querySelector("#leftButton")
      .addEventListener("click", () => onclick(true));
    document
      .querySelector("#rightButton")
      .addEventListener("click", () => onclick(false));
  }

  async function urlDispatch() {
    async function fetchFromServer(endpoint, paramKey, paramValue) {
      let params = new URLSearchParams();
      params.append(paramKey, paramValue);
      const songs_request = fetch(`${BACKEND_URL}/${endpoint}?${params}`);
      const songs_response = await songs_request;

      if (songs_response.ok == false) {
        throw new Error((await playlist_response.json()).err);
      }
      const songs = await songs_response.json();
      let deserialisedSongs = songs.map(deserialiseSong);
      return Promise.all(deserialisedSongs);
    }

    async function youtubePlaylistIDtoSongObjects(playlistID) {
      return await fetchFromServer("getplaylist", "playlistID", playlistID);
    }

    async function bandcampAlbumURLtoSongObjects(albumURL) {
      return await fetchFromServer("getbandcampalbum", "albumURL", albumURL);
    }

    const input = document.querySelector("#playlistUrl").value;
    let urlMatch;
    console.log(
      input.match(
        /^(?:https?:\/\/(?:www\.)?)?youtube\.com\/playlist\?list=(?:(?:(.+)&si=.+)|(.+))/,
      ),
    );
    console.log(
      input.match(/^(?:https?:\/\/)(?:.+)\.bandcamp\.com\/album\/.+/),
    );

    if (
      (urlMatch = input.match(
        /^(?:https?:\/\/(?:www\.)?)?youtube\.com\/playlist\?list=(?:(?:(.+)&si=.+)|(.+))/,
      ))
    ) {
      //If a match for the first group isn't found, uses the result of the second match group.
      const playlistID = urlMatch[1] ? urlMatch[1] : urlMatch[2];
      let songList = await youtubePlaylistIDtoSongObjects(playlistID);
      return songList;
    } else if (
      (urlMatch = input.match(
        /^(?:https?:\/\/)(?:.+)\.bandcamp\.com\/album\/.+/,
      ))
    ) {
      const albumURL = urlMatch[0];
      let songList = await bandcampAlbumURLtoSongObjects(albumURL);
      return songList;
    } else {
      throw "URL improperly formatted or Service not supported";
    }
  }

  async function deserialize(file) {
    const jsonString = await file.text();
    const order = await JSON.parse(jsonString);
    return deserilializeGen(order);
  }

  document
    .querySelector("#playlistUrl")
    .addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        document.querySelector("#playlistUrlButton").click();
      }
    });

  document
    .querySelector("#playlistUrlButton")
    .addEventListener("click", async () => {
      document.querySelector("#errorText").innerHTML = "";
      try {
        const songs = await urlDispatch();
        console.log(songs);
        const gen = createGen(songs);
        console.log(gen);
        main(gen);
      } catch (err) {
        console.log(err);
        document.querySelector("#errorText").innerHTML = err;
      }
    });

  document
    .querySelector("#deserialize")
    .addEventListener("change", async function () {
      try {
        const file = this.files[0];
        const gen = await deserialize(file);
        main(gen);
      } catch (err) {
        console.log(err);
        document.querySelector("#errorText").innerHTML = err;
      }
    });
});

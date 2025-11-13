"use strict";

// Global Variables

/** The URL for the server-side. Replace when deploying to production. */
const BACKEND_URL = "http://127.0.0.1:5000";

// Binary tree
const emptyNode = Symbol("emptyNode");

/** @typedef {emptyNode|bTree} BinaryTree */
class bTree {
  constructor(entry, left = emptyNode, right = emptyNode) {
    this.entry = entry;
    this.left = left;
    this.right = right;
  }
}

/**
 * Takes an unbalanced BinaryTree and retuens an equivilent balanced binary tree.
 * @param {BinaryTree} tree
 * @returns {BinaryTree}
 */
function balancebTree(tree) {
  return listtobTree(bTreetoList(tree));
}

/**
 * Converts a BinaryTree to an ordered Array
 * @param {BinaryTree} tree
 * @returns {array}
 */
function bTreetoList(tree) {
  if (tree === emptyNode) {
    return [];
  } else {
    return [...bTreetoList(tree.left), tree.entry, ...bTreetoList(tree.right)];
  }
}

/**
 * Converts ordered Array into a *balanced* BinaryTree
 * @param {array} list
 * @return {BinaryTree}
 */
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

// Song objects

/** The Interface for song objects.
 *  @interface
 */
class AbstractSong {
  /**
   * Each AbstractSong will have a corresponding serializableSong.
   * An object of that datatype that must be passed into the constructor.
   * @param {serializableSong} serialized
   */
  constructor(serialized) {}

  /**
   * This returns the corresponding serializableSong
   * @returns {serializableSong}
   */
  serializable() {
    return;
  }

  /**
   * Returns a String of html
   * When rendered it shows an embed of the song and corresponding information
   * @returns {string}
   */
  itemView() {
    return;
  }

  /**
   * Returns a String that displays the song name and (usually) artist
   * This is then used when the ranked list of songs is shown to the user
   * @returns {string}
   */
  listItem() {
    return;
  }
}

/**
 * A song sourced from a youtube video.
 * # Why is there no Artist field?
 * There is no reliable and quick way to find the artist who made a song uploaded to Youtube.
 * Youtube, being a platform that everyone can upload to, often has videos uploaded by people who are not the original creator of the song.
 * Thus, the name of the channel cannot be relied upon to be the name of the artist who produced the song.
 */
class youtubeVideo extends AbstractSong {
  #videoId;
  #title;

  /** @param {serializableYoutubeVideo} param0 */
  constructor({ title, videoId }) {
    this.#title = title;
    this.#videoId = videoId;
  }

  /** @returns {serializableYoutubeVideo} */
  serializable() {
    return new serializableYoutubeVideo(this.#title, this.#videoId);
  }

  /** @returns {string} */
  itemView() {
    return `<div class='embed-container'><iframe src='https://www.youtube.com/embed/${this.#videoId}' frameborder='0' allowfullscreen></iframe></div>
         <p>${this.#title}</p>`;
  }

  /** @returns {string} */
  listItem() {
    return this.title;
  }
}

/** A song sourced from a Bandcamp track. */
class bandcampTrack extends AbstractSong {
  #title;
  #albumTitle;
  #artist;
  #albumID;
  #trackID;
  #albumArt;

  /** @param {serializableBandcampTrack} param0  */
  constructor({ title, albumTitle, artist, albumID, trackID, albumArt }) {
    this.#title = title;
    this.#albumTitle = albumTitle;
    this.#artist = artist;
    this.#albumID = albumID;
    this.#trackID = trackID;
    this.#albumArt = albumArt;
  }

  /** @returns {serializableBandcampTrack}  */
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

  /** @returns {string} */
  itemView() {
    return `<img src=${this.#albumArt}>
    <div>${this.#title}</div>
    <div>${this.#albumTitle}</div>
    <div>${this.#artist}</div>
    <iframe style="border: 0; width: 100%; height: 42px;" src="https://bandcamp.com/EmbeddedPlayer/album=${this.#albumID}/size=small/bgcol=ffffff/linkcol=0687f5/artwork=none/track=${this.#trackID}/transparent=true/" seamless></iframe>`;
  }

  /** @returns {string} */
  listItem() {
    return `${this.#title} - ${this.#artist}`;
  }
}

// Serializable song objects

/**
 * The Super Class to all Serialized representations of songs.
 * A serializableSong is recieved either fom the backend sever or from the user's computer, and
 * A serializableSong's values (except for it's type) are the values needed to initialise it's corresponding AbstractSong.
 * The serializableSong#type parameter allows the deserialiseSong function to dispatch based on type.
 */
class serializableSong {
  /** @param {("youtubeVideo"|"bandcampTrack")} type */
  constructor(type) {
    this.type = type;
  }
}

class serializableYoutubeVideo extends serializableSong {
  /**
   * @param {string} title
   * @param {string} videoId
   */
  constructor(title, videoId) {
    super("youtubeVideo");
    this.title = title;
    this.videoId = videoId;
  }
}

class serializableBandcampTrack extends serializableSong {
  /**
   * @param {string} title
   * @param {string} albumTitle
   * @param {string} artist
   * @param {int} albumID
   * @param {int} trackID
   * @param {string} albumArt
   */
  constructor(title, albumTitle, artist, albumID, trackID, albumArt) {
    super("bandcampTrack");
    this.title - title;
    this.albumTitle = albumTitle;
    this.artist = artist;
    this.albumID = albumID;
    this.trackID = trackID;
    this.albumArt = albumArt;
  }
}

/**
 * Convert a serializable representation of an abstractSong into said abstractSong.
 * @param {serializableSong} pSong
 * @returns {AbstractSong}
 */
function restoreSong(pSong) {
  switch (pSong.type) {
    case "youtubeVideo":
      return new youtubeVideo(pSong);
    case "bandcampTrack":
      return new bandcampTrack(pSong);
    default:
      throw "Unable to deserialize song: Invalid type";
  }
}

// Sort Generator datatypes

/** The value yielded by a sortGenerator. */
class SortGeneratorResponse {
  /**
   * @param {AbstractSong} left
   * @param {AbstractSong} right
   * @param {Function} serialiseResults
   */
  constructor(left, right, serialiseResults) {
    this.left = left;
    this.right = right;
    /** This should be a function that, when called, returns a json string containing the state needed to restart the generator" */
    this.serialiseResults = serialiseResults;
  }
}

/**
 * Returns a SortGenerator that sorts songs via a binary insertion sort algorithm.
 * @param {AbstractSong[]} toOrder
 * @param {AbstractSong[]} ordered
 * @returns {Generator}
 */
function* binaryInsertionSortGen(toOrder, ordered) {
  /**
   *
   * @param {BinaryTree} stateTree
   * @param {int} toOrderIndex
   * @returns {function(): string}
   */
  function serialize(stateTree, toOrderIndex) {
    let stateList = bTreetoList(stateTree);
    let restToOrder = toOrder.slice(toOrderIndex);
    return () => {
      let orderObject = new serializableBinaryInsertionOrderState(
        stateList,
        restToOrder,
      );
      return JSON.stringify(orderObject);
    };
  }
  let state = ordered ? listtobTree(ordered) : new bTree(toOrder[0]);
  if (!ordered) {
    toOrder = toOrder.slice(1);
  }

  for (let toInsertIndex in toOrder) {
    let toInsert = toOrder[toInsertIndex];
    function* insert(tree) {
      let betterThan = yield new SortGeneratorResponse(
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

/**
 * Returns a SortGenerator that sorts songs via the bottom-up merge sort algorithm.
 * @param {AbstractSong[]} toOrder
 * @param {serializableMergeOrderState} state
 * @returns {Generator}
 */
function* mergeSortGen(toOrder, state) {
  /**
   * Parameter "width" is passed so it can be passed to the serialisation function in the SortGeneratorResponse.
   * Parameters copy2, index2, leftIndex, and rightIndex are passed so that the function can continue from a specified point in computation.
   * @param {AbstractSong} array
   * @param {int} low
   * @param {int} mid
   * @param {int} high
   * @param {int} width
   * @param {int} copy2
   * @param {int} index2
   * @param {int} leftIndex
   * @param {int} rightIndex
   */
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
    let copy = copy2 ?? [...array];
    let leftListIndex = leftIndex ?? low;
    let rightListIndex = rightIndex ?? mid + 1;
    let index = index2 ?? low;

    for (index; index <= high; index++) {
      if (leftListIndex > mid) {
        array[index] = copy[rightListIndex];
        rightListIndex++;
      } else if (rightListIndex > high) {
        array[index] = copy[leftListIndex];
        leftListIndex++;
      } else {
        let [x, y] = [copy[leftListIndex], copy[rightListIndex]];
        let leftBetterThanRight = yield new SortGeneratorResponse(x, y, () => {
          let orderObject = new serializableMergeOrderState(
            array,
            low,
            mid,
            high,
            width,
            copy,
            index,
            leftListIndex,
            rightListIndex,
          );

          return JSON.stringify(orderObject);
        });

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
    let { array, low, mid, high, width, copy, index, leftIndex, rightIndex } =
      state;

    yield* merge(
      array,
      low,
      mid,
      high,
      width,
      copy,
      index,
      leftIndex,
      rightIndex,
    );

    let listLength = array.length;
    // low is always equal to the i of that loop.
    let i = low + width * 2;
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

    return array;
  }
}

// Serializable sort generator states

/**
 * A Serializale representation of a SortGenerators state.
 * We need these so the user can save their progress to disk.
 */
class SerializableSortGenState {
  /**
   * @param {string} type
   */
  constructor(type) {
    this.type = type;
  }
}

class serializableBinaryInsertionOrderState extends SerializableSortGenState {
  /**
   * @param {AbstractSong} ordered
   * @param {AbstractSong} songsToOrder
   * Length of songsToOrder must be at least 1.
   */
  constructor(ordered, songsToOrder) {
    super("BinaryInsertionOrder");
    this.ordered = ordered.map((x) => x.serializable());
    this.songsToOrder = songsToOrder.map((x) => x.serializable());
  }

  /**
   * @param {SerializableSortGenState} serializedOrder
   * @returns {Generator}
   */
  static restore(serializedOrder) {
    if (serializedOrder.songsToOrder.length == 0) {
      throw "Error: File contains no songs to sort";
    } else {
      return binaryInsertionSortGen(
        serializedOrder.songsToOrder.map(restoreSong),
        serializedOrder.ordered.map(restoreSong),
      );
    }
  }
}

class serializableMergeOrderState extends SerializableSortGenState {
  /**
   *
   * @param {serializableSong[]} array
   * @param {int} low
   * @param {int} mid
   * @param {int} high
   * @param {int} width
   * @param {serializableSong[]} copy
   * @param {int} index
   * @param {int} leftIndex
   * @param {int} rightIndex
   */
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

  /**
   * @param {AbstractSong[]} serializedOrder
   * @returns {Generator}
   */
  static restore(serializedOrder) {
    serializedOrder.array = serializedOrder.array.map(restoreSong);
    serializedOrder.copy = serializedOrder.copy.map(restoreSong);
    return mergeSortGen(serializedOrder.array, serializedOrder);
  }
}

/**
 * Takes a SerializableSortGenState and returns the equivilent Generator.
 * @param {SerializableSortGenState} order
 * @returns {Generator}
 */
function restoreGen(order) {
  switch (order.type) {
    case "BinaryInsertionOrder":
      return serializableBinaryInsertionOrderState.restore(order);
    case "MergeOrderState":
      return serializableMergeOrderState.restore(order);
    default:
      throw "Unable to deserialize order: Invalid type";
  }
}

// Other

/**
 * Returns a sortGenerator, of the type sepcified by the drop down "#sortingAlgorithm".
 * @param {promise<AbstractSong[]>} songList
 * @returns {promise<Generator>}
 */
async function createGen(songs) {
  let songList = await songs;
  if (songList.length < 2) {
    throw "Error: Need a list of at least 2 songs";
  }
  const algorithmSelection = document.querySelector("#sortingAlgorithm").value;
  const gen =
    algorithmSelection === "binaryInsertionSort"
      ? binaryInsertionSortGen(songList)
      : algorithmSelection === "mergeSort"
        ? mergeSortGen(songList)
        : console.error("what");
  return gen;
}

/** Resets the DOM to it's initial state (bar the value of #errorText). */
function resetDOM() {
  document.querySelector("#headerText").innerHTML = "Welcome to Rankly!";
  document.querySelector("#mainView").style.display = "none";
  document.querySelector("#serialize").style.display = "none";
  document.querySelector("#toHide").style.display = "grid";
}

/**
 * The main function. Handles events from the UI and updates it accordingly.
 * @param {promise<Generator>} gen
 */
async function main(genp) {
  let leftSongView = document.querySelector("#left");
  let rightSongView = document.querySelector("#right");
  let gen = await genp;

  /**
   * Takes a serialized SortGen as a JSON string and prompts the user to save it to disk.
   * @param {string} jsonString
   */
  function save(jsonString) {
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

  /**
   * Called when a song is selected by the user. "betterThan" is true if the left button is clicked and false if the right button is clicked.
   * @param {Boolean} betterThan
   */
  function onclick(betterThan) {
    // We do a deep copy of the save button element to remove it's event listeners
    // The alternative is passing lambdas around, which, considering how the code is structured, would be a pain.
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
      leftSongView.innerHTML = left.itemView();
      rightSongView.innerHTML = right.itemView();
    }
  }

  /**
   * Performs cleanup and shows results list.
   * @param {AbstractSong[]} finalState
   */
  function onFinish(finalState) {
    resetDOM();

    for (let item of finalState) {
      let listElement = document.createElement("li");
      listElement.innerHTML = item.listItem();
      document.querySelector("#results").appendChild(listElement);
    }
  }

  //Setup DOM
  document.querySelector("#headerText").innerHTML = "Which song is better?";
  document.querySelector("#mainView").style.display = "grid";
  document.querySelector("#serialize").style.display = "inline";
  document.querySelector("#toHide").style.display = "none";

  // Get first two songs to compare.
  let genResult = gen.next();
  let { left, right, serialiseResults } = genResult.value;
  document
    .querySelector("#serialize")
    .addEventListener("click", () => save(serialiseResults()));

  leftSongView.innerHTML = left.itemView();
  rightSongView.innerHTML = right.itemView();

  // Setup event listeners.
  leftButton.addEventListener("click", () => onclick(true));
  rightButton.addEventListener("click", () => onclick(false));
}

/**
 * Checks the URL (from the #playlistUrl element) and returns a songlist corresponding to it's contents.
 * @returns {promise<AbstractSong[]>}
 */
async function urlDispatch() {
  /**
   * Fetch from the specified endpoint with the specified key and value.
   * @param {string} endpoint
   * @param {string} paramKey
   * @param {string} paramValue
   * @returns {promise<AbstractSong[]>}
   */
  async function fetchFromServer(endpoint, paramKey, paramValue) {
    let params = new URLSearchParams();
    params.append(paramKey, paramValue);
    const songs_request = fetch(`${BACKEND_URL}/${endpoint}?${params}`);
    const songs_response = await songs_request;

    if (songs_response.ok == false) {
      throw new Error((await playlist_response.json()).err);
    }
    const songs = await songs_response.json();
    let deserialisedSongs = songs.map(restoreSong);
    return Promise.all(deserialisedSongs);
  }

  /**
   * @param {string} playlistID
   * @returns {promise<youtubeVideo>}
   */
  async function youtubePlaylistIDtoSongObjects(playlistID) {
    return fetchFromServer("getplaylist", "playlistID", playlistID);
  }

  /**
   * @param {string} albumURL
   * @returns {promise<bandcampTrack>}
   */
  async function bandcampAlbumURLtoSongObjects(albumURL) {
    return fetchFromServer("getbandcampalbum", "albumURL", albumURL);
  }

  const input = document.querySelector("#playlistUrl").value;

  let urlMatch;
  if (
    (urlMatch = input.match(
      /^(?:https?:\/\/(?:www\.)?)?youtube\.com\/playlist\?list=(?:(?:(.+)&si=.+)|(.+))/,
    ))
  ) {
    //If a match for the first group isn't found, uses the result of the second match group.
    const playlistID = urlMatch[1] ? urlMatch[1] : urlMatch[2];
    return youtubePlaylistIDtoSongObjects(playlistID);
  } else if (
    (urlMatch = input.match(/^(?:https?:\/\/)(?:.+)\.bandcamp\.com\/album\/.+/))
  ) {
    const albumURL = urlMatch[0];
    return bandcampAlbumURLtoSongObjects(albumURL);
  } else {
    throw "URL improperly formatted or Service not supported";
  }
}

/**
 * @param {File} file
 * @returns {promise<Generator>}
 */
async function deserialize(file) {
  try {
    const jsonString = await file.text();
    const order = await JSON.parse(jsonString);
    return restoreGen(order);
  } catch {
    throw "Error: Error deserializing save data. File corrupt?";
  }
}

/**
 * The method that is called when the application encounters an error.
 * @param {string} errMsg
 */
function whenError(errMsg) {
  resetDOM();
  console.log(errMsg);
  document.querySelector("#errorText").innerHTML = errMsg;
}

// Setup initial event listeners
document.addEventListener("DOMContentLoaded", () => {
  window.addEventListener("error", (e) => whenError(e.error));
  window.addEventListener("unhandledrejection", (e) => whenError(e.reason));

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
      const songs = urlDispatch();
      const gen = createGen(songs);
      main(gen);
    });

  document
    .querySelector("#deserialize")
    .addEventListener("change", async function () {
      const file = this.files[0];
      const gen = deserialize(file);
      main(gen);
    });
});

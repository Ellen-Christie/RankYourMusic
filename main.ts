// @ts-check
"use strict";
// Global Variables
/** The URL for the server-side. Replace when deploying to production. */
const BACKEND_URL = "http://127.0.0.1:5000";

// Helper functions
function throwHTMLErrorExpression(): never {
  throw "Error with HTML of app. You should not see this.";
}

// Misc. Classes/Types

type NonEmptyArray<T> = [T, ...T[]] | [...(T[] | []), T, ...(T[] | [])];
type ArrayOfTwoOrMore<T> =
  | [T, ...NonEmptyArray<T>]
  | [...NonEmptyArray<T>, T, ...(NonEmptyArray<T> | [])]
  | [...(NonEmptyArray<T> | []), T, ...NonEmptyArray<T>];

function isNotNullish<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}

function ArrayHasNoNulls<T>(a: T[]): boolean {
  return a.every(isNotNullish);
}

// Binary tree
type EmptyNode = "emptyNode";
const emptyNode: EmptyNode = "emptyNode";
type BinaryTree = EmptyNode | NonNullable<bTree>;

class bTree {
  entry: any;
  left: BinaryTree;
  right: BinaryTree;

  constructor(
    entry: any,
    left: BinaryTree = emptyNode,
    right: BinaryTree = emptyNode,
  ) {
    this.entry = entry;
    this.left = left;
    this.right = right;
  }
}

/**
 * Takes an unbalanced BinaryTree and retuens an equivilent balanced binary tree.
 */
function balancebTree(tree: bTree): bTree;
function balancebTree(tree: EmptyNode): EmptyNode;
function balancebTree(tree: BinaryTree): BinaryTree {
  return listtobTree(bTreetoList(tree));
}

/**
 * Converts a BinaryTree to an ordered Array
 */
function bTreetoList(tree: BinaryTree): any[] | NonEmptyArray<any> {
  if (tree === emptyNode) {
    return [];
  } else {
    const result: NonEmptyArray<any> = [
      ...bTreetoList(tree.left),
      tree.entry,
      ...bTreetoList(tree.right),
    ];
    return result;
  }
}

/**
 * Converts ordered array into a *balanced* BinaryTree
 */
function listtobTree(list: NonEmptyArray<any>): bTree;
function listtobTree(list: []): EmptyNode;
function listtobTree<T>(list: Array<T>): BinaryTree {
  function partialTree(elts: Array<T>, n: number): [BinaryTree, Array<T>] {
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

/**
 * The Interface for song objects.
 *
 * @remarks
 *
 * Each AbstractSong will have a corresponding SerializableSong.
 * An object of that datatype that must be passed into the constructor.
 */
interface SongInterface {
  /**
   * This returns the corresponding SerializableSong
   */
  serializable(): SerializableSong;

  /**
   * Returns a String of html
   * When rendered it shows an embed of the song and corresponding information
   */
  itemView(): string;

  /**
   * Returns a String that displays the song name and (usually) artist
   * This is then used when the ranked list of songs is shown to the user
   */
  listItem(): string;
}

/**
 * A song sourced from a youtube video.
 * # Why is there no Artist field?
 * There is no reliable and quick way to find the artist who made a song uploaded to Youtube.
 * Youtube, being a platform that everyone can upload to, often has videos uploaded by people who are not the original creator of the song.
 * Thus, the name of the channel cannot be relied upon to be the name of the artist who produced the song.
 */
class youtubeVideo implements SongInterface {
  #videoId: string;
  #title: string;

  constructor({ title, videoId }: SerializableYoutubeVideo) {
    this.#title = title;
    this.#videoId = videoId;
  }

  /** @returns {SerializableYoutubeVideo} */
  serializable(): SerializableYoutubeVideo {
    return {
      type: SerializableSongTypeTag.youtubeVideo,
      title: this.#title,
      videoId: this.#videoId,
    };
  }

  itemView(): string {
    return `<div class='embed-container'><iframe src='https://www.youtube.com/embed/${this.#videoId}' frameborder='0' allowfullscreen></iframe></div>
         <p>${this.#title}</p>`;
  }

  listItem(): string {
    return this.#title;
  }
}

/** A song sourced from a Bandcamp track. */
class bandcampTrack implements SongInterface {
  #title: string;
  #albumTitle: string;
  #artist: string;
  #albumID: string;
  #trackID: string;
  #albumArt: string;

  constructor({
    title,
    albumTitle,
    artist,
    albumID,
    trackID,
    albumArt,
  }: SerializableBandcampTrack) {
    this.#title = title;
    this.#albumTitle = albumTitle;
    this.#artist = artist;
    this.#albumID = albumID;
    this.#trackID = trackID;
    this.#albumArt = albumArt;
  }

  serializable(): SerializableBandcampTrack {
    return {
      type: SerializableSongTypeTag.bandcampTrack,
      title: this.#title,
      albumTitle: this.#albumTitle,
      artist: this.#artist,
      albumID: this.#albumID,
      trackID: this.#trackID,
      albumArt: this.#albumArt,
    };
  }

  itemView(): string {
    return `<img src=${this.#albumArt}>
    <div>${this.#title}</div>
    <div>${this.#albumTitle}</div>
    <div>${this.#artist}</div>
    <iframe style="border: 0; width: 100%; height: 42px;" src="https://bandcamp.com/EmbeddedPlayer/album=${this.#albumID}/size=small/bgcol=ffffff/linkcol=0687f5/artwork=none/track=${this.#trackID}/transparent=true/" seamless></iframe>`;
  }

  listItem(): string {
    return `${this.#title} - ${this.#artist}`;
  }
}

// Serializable song objects

/**
 * The type of all Serialized representations of songs.
 * A SerializableSong is recieved either fom the backend sever or from the user's computer, and
 * A SerializableSong's values (except for it's type) are the values needed to initialise it's corresponding Song.
 * The SerializableSong#type parameter allows the deserialiseSong function to dispatch based on type.
 */
type SerializableSong = { type: SerializableSongTypeTag } & (
  | SerializableYoutubeVideo
  | SerializableBandcampTrack
);

const enum SerializableSongTypeTag {
  youtubeVideo = "youtubeVideo",
  bandcampTrack = "bandcampTrack",
}
class SerializableYoutubeVideo {
  constructor(
    public type: SerializableSongTypeTag.youtubeVideo,
    public title: string,
    public videoId: string,
  ) {}
}

class SerializableBandcampTrack {
  constructor(
    public type: SerializableSongTypeTag.bandcampTrack,
    public title: string,
    public albumTitle: string,
    public artist: string,
    public albumID: string,
    public trackID: string,
    public albumArt: string,
  ) {}
}

/**
 * Convert a serializable representation of a Song into said Song.
 */
function restoreSong(pSong: SerializableSong): SongInterface {
  switch (pSong.type) {
    case SerializableSongTypeTag.youtubeVideo:
      return new youtubeVideo(pSong);
    case SerializableSongTypeTag.bandcampTrack:
      return new bandcampTrack(pSong);
  }
}

// Sort Generator datatypes

/** The value yielded by a sortGenerator.
 * @param serialiseResults - Function that, when called, returns a json string containing the state needed to restart the generator"
 */
class SortGeneratorResponse {
  constructor(
    public left: SongInterface,
    public right: SongInterface,
    public serialiseResults: () => SerializableSortGenState,
  ) {}
}

/**
 * Returns a SortGenerator that sorts songs via a binary insertion sort algorithm.
 */
function* binaryInsertionSortGen(
  toOrder: NonEmptyArray<SongInterface>,
  ordered?: NonEmptyArray<SongInterface>,
): Generator<SortGeneratorResponse> {
  function serialize(
    stateTree: BinaryTree,
    toOrderIndex: number,
  ): () => SerializableBinaryInsertionOrderState {
    let stateList = bTreetoList(stateTree);
    let restToOrder = toOrder.slice(toOrderIndex);
    return () => {
      let orderObject = new SerializableBinaryInsertionOrderState(
        stateList,
        restToOrder,
      );
      return orderObject;
    };
  }
  let state: bTree = ordered ? listtobTree(ordered) : new bTree(toOrder[0]);
  //If there were no ordered songs passed we start looping from 1,
  //because the first song has already been used for the initial state
  for (
    let toInsertIndex = ordered ? 0 : 1;
    toInsertIndex < toOrder.length;
    toInsertIndex++
  ) {
    const toInsert = toOrder[toInsertIndex];
    if (!toInsert) {
      continue;
    } else {
      // Needed for typescript compiler. No clue why, probably js scoping stuff.
      const nonNulltoInsert: SongInterface = toInsert;

      function* insert(tree: bTree): Generator<SortGeneratorResponse> {
        const betterThan = yield new SortGeneratorResponse(
          nonNulltoInsert,
          tree.entry,
          serialize(state, toInsertIndex),
        );
        if (betterThan === true) {
          if (tree.left === emptyNode) {
            tree.left = new bTree(nonNulltoInsert);
          } else {
            yield* insert(tree.left);
          }
        } else {
          if (tree.right === emptyNode) {
            tree.right = new bTree(nonNulltoInsert);
          } else {
            yield* insert(tree.right);
          }
        }
      }
      yield* insert(state);
      const temp = balancebTree(state);
      state = temp;
    }
  }
  return bTreetoList(state);
}

/**
 * Returns a SortGenerator that sorts songs via the bottom-up merge sort algorithm.
 */
function* mergeSortGen(
  toOrder: SongInterface[],
  state?: {
    array: SongInterface[];
    low: number;
    mid: number;
    high: number;
    width: number;
    copy?: SongInterface[];
    index?: number;
    leftIndex?: number;
    rightIndex?: number;
  },
): Generator<SortGeneratorResponse> {
  /**
   * Parameter "width" is passed so it can be passed to the serialisation function in the SortGeneratorResponse.
   * Parameters copy2, index2, leftIndex, and rightIndex are passed so that the function can continue from a specified point in computation.
   */
  function* merge(
    array: SongInterface[],
    low: number,
    mid: number,
    high: number,
    width: number,
    copy2?: SongInterface[],
    index2?: number,
    leftIndex?: number,
    rightIndex?: number,
  ): Generator<SortGeneratorResponse, undefined, Boolean> {
    let copy = copy2 ?? [...array];
    let leftListIndex = leftIndex ?? low;
    let rightListIndex = rightIndex ?? mid + 1;
    let index = index2 ?? low;

    if (!(ArrayHasNoNulls(array) && ArrayHasNoNulls(copy))) {
      throw "Error: Merge Sort Generator received list with a null value";
    }

    for (index; index <= high; index++) {
      if (leftListIndex > mid) {
        array[index] = copy[rightListIndex]!;
        rightListIndex++;
      } else if (rightListIndex > high) {
        array[index] = copy[leftListIndex]!;
        leftListIndex++;
      } else {
        let [x, y] = [copy[leftListIndex]!, copy[rightListIndex]!];
        let leftBetterThanRight = yield new SortGeneratorResponse(x, y, () => {
          return new SerializableMergeOrderState(
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

enum SortGenTypes {
  BinaryInsertionOrderState = "binaryInsertionSort",
  MergeOrderState = "mergeSort",
}

function inSortGenTypes(x: string): x is SortGenTypes {
  return (Object.values(SortGenTypes) as string[]).includes(x);
}

/**
 * A Serializable representation of a SortGenerators state.
 * We need these so the user can save their progress to disk.
 */
type SerializableSortGenState = { type: SortGenTypes } & (
  | SerializableBinaryInsertionOrderState
  | SerializableMergeOrderState
);

class SerializableBinaryInsertionOrderState {
  type: SortGenTypes.BinaryInsertionOrderState =
    SortGenTypes.BinaryInsertionOrderState;
  ordered: SerializableSong[];
  songsToOrder: NonEmptyArray<SerializableSong>;
  constructor(
    ordered: SongInterface[],
    songsToOrder: NonEmptyArray<SongInterface>,
  ) {
    this.ordered = ordered.map((x) => x.serializable());
    this.songsToOrder = songsToOrder.map((x) => x.serializable());
  }

  static restore(
    serializedOrder: SerializableBinaryInsertionOrderState,
  ): Generator<SortGeneratorResponse> {
    if (serializedOrder.songsToOrder.length == 0) {
      throw "Error: File contains no songs to sort";
    } else {
      return binaryInsertionSortGen(
        //
        serializedOrder.songsToOrder.map(
          restoreSong,
        ) as NonEmptyArray<SongInterface>,
        serializedOrder.ordered.map(restoreSong),
      );
    }
  }
}

class SerializableMergeOrderState {
  type: SortGenTypes.MergeOrderState = SortGenTypes.MergeOrderState;
  array: SerializableSong[];
  copy: SerializableSong[];
  constructor(
    array: SongInterface[],
    public low: number,
    public mid: number,
    public high: number,
    public width: number,
    copy: SongInterface[],
    public index: number,
    public leftIndex: number,
    public rightIndex: number,
  ) {
    this.array = array.map((song) => song.serializable());
    this.copy = copy.map((song) => song.serializable());
  }

  static restore(
    serializedOrder: SerializableMergeOrderState,
  ): Generator<SortGeneratorResponse> {
    return mergeSortGen(serializedOrder.array.map(restoreSong), {
      ...serializedOrder,
      array: serializedOrder.array.map(restoreSong),
      copy: serializedOrder.copy.map(restoreSong),
    });
  }
}

//
/**
 * Takes a SerializableSortGenState and returns the equivilent Generator.
 */
function restoreGen(
  order: SerializableSortGenState,
): Generator<SortGeneratorResponse> {
  switch (order.type) {
    case SortGenTypes.BinaryInsertionOrderState:
      return SerializableBinaryInsertionOrderState.restore(order);
    case SortGenTypes.MergeOrderState:
      return SerializableMergeOrderState.restore(order);
  }
}

// Misc. functions
async function deserialize(
  file: File,
): Promise<Generator<SortGeneratorResponse>> {
  try {
    const jsonString = await file.text();
    const order = await JSON.parse(jsonString);
    return restoreGen(order);
  } catch {
    throw "Error: Error deserializing save data. File corrupt?";
  }
}

/**
 * Returns a sortGenerator, of the type specified by the drop down "#sortingAlgorithm".
 */
async function sortGenDispatch(
  songListPromise: Promise<ArrayOfTwoOrMore<SongInterface>>,
  algoType: SortGenTypes,
): Promise<Generator<SortGeneratorResponse>> {
  let songList = await songListPromise;
  switch (algoType) {
    case SortGenTypes.BinaryInsertionOrderState:
      return binaryInsertionSortGen(songList);
    case SortGenTypes.MergeOrderState:
      return mergeSortGen(songList);
  }
}
// Fontend-facing Code
document.addEventListener("DOMContentLoaded", () => {
  // Setup initial event listeners
  window.addEventListener("error", (e) => whenError(e.error));
  window.addEventListener("unhandledrejection", (e) => whenError(e.reason));

  // Assign elements to variables
  // Throws error if the HTML element doesn't exist (to make typescript happy)

  const playlistURLEl: HTMLInputElement =
    document.querySelector("#playlistUrl") ?? throwHTMLErrorExpression();
  const playlistUrlButtonEl: HTMLInputElement =
    document.querySelector("#playlistUrlButton") ?? throwHTMLErrorExpression();
  let serializeEl: HTMLButtonElement =
    document.querySelector("#serialize") ?? throwHTMLErrorExpression();
  const deserializeEl: HTMLInputElement =
    document.querySelector("#deserialize") ?? throwHTMLErrorExpression();
  const errorTextEl: HTMLParagraphElement =
    document.querySelector("#errorText") ?? throwHTMLErrorExpression();
  const resultsEl: HTMLOListElement =
    document.querySelector("#results") ?? throwHTMLErrorExpression();
  const headerTextEl: HTMLHeadingElement =
    document.querySelector("#headerText") ?? throwHTMLErrorExpression();
  const mainViewEl: HTMLDivElement =
    document.querySelector("#mainView") ?? throwHTMLErrorExpression();
  const toHideEl: HTMLDivElement =
    document.querySelector("#toHide") ?? throwHTMLErrorExpression();
  const leftSongView: HTMLDivElement =
    document.querySelector("#left") ?? throwHTMLErrorExpression();
  const rightSongView: HTMLDivElement =
    document.querySelector("#right") ?? throwHTMLErrorExpression();
  const leftButton: HTMLButtonElement =
    document.querySelector("#leftButton") ?? throwHTMLErrorExpression();
  const rightButton: HTMLButtonElement =
    document.querySelector("#rightButton") ?? throwHTMLErrorExpression();
  const sortingAlgorithmEl: HTMLInputElement =
    document.querySelector("#sortingAlgorithm") ?? throwHTMLErrorExpression();

  //Auxiliary functions
  /**
   * The function that is called when the application encounters an error.
   */
  function whenError(errMsg: string) {
    resetDOM();
    console.log(errMsg);
    errorTextEl.innerHTML = errMsg;
  }

  /**
   * Checks the URL (from the #playlistUrl element) and returns a songlist corresponding to it's contents.
   */
  async function urlDispatch(): Promise<ArrayOfTwoOrMore<SongInterface>> {
    /**
     * Fetch from the specified endpoint with the specified key and value.
     */
    async function fetchFromServer(
      endpoint: string,
      paramKey: string,
      paramValue: string,
    ): Promise<SongInterface[]> {
      let params = new URLSearchParams();
      params.append(paramKey, paramValue);
      const songs_request = fetch(`${BACKEND_URL}/${endpoint}?${params}`);
      const songs_response = await songs_request;

      if (songs_response.ok == false) {
        throw new Error((await songs_response.json()).err);
      }
      const songs = await songs_response.json();
      let deserialisedSongs = songs.map(restoreSong);
      return Promise.all(deserialisedSongs);
    }

    const input = playlistURLEl.value;

    let urlMatch: string[] | null;
    let resultPromise: Promise<SongInterface[]>;
    if (
      (urlMatch = input.match(
        /^(?:https?:\/\/(?:www\.)?)?youtube\.com\/playlist\?list=(?:(?:(.+)&si=.+)|(.+))/,
      ))
    ) {
      //If a match for the first group isn't found, uses the result of the second match group.
      const playlistID = urlMatch[1] ? urlMatch[1] : (urlMatch[2] as string);
      // Use of assertion above because:
      // 1. There are three match groups in the mentioned regular expression
      // 2. There are no scenarios where the first can match without one of the other two matching
      resultPromise = fetchFromServer("getplaylist", "playlistID", playlistID);
    } else if (
      (urlMatch = input.match(
        /^(?:https?:\/\/)(?:.+)\.bandcamp\.com\/album\/.+/,
      ))
    ) {
      const albumURL = urlMatch[0];
      throw "Sorry, bandcamp support is currently borked :(";
    } else {
      throw "URL improperly formatted or Service not supported";
    }
    const result = await resultPromise;
    if (result.length >= 2) {
      return result;
    } else {
      throw "Playlist must be at least two songs long.";
    }
  }

  /** Resets the DOM to it's initial state (bar the value of #errorText). */
  function resetDOM() {
    headerTextEl.innerHTML = "Welcome to Rankly!";
    mainViewEl.style.display = "none";
    serializeEl.style.display = "none";
    toHideEl.style.display = "grid";
  }

  /**
   * The main function. Handles events from the UI and updates it accordingly.
   */
  async function main(genp: Promise<Generator<SortGeneratorResponse>>) {
    let gen = await genp;

    /**
     * Takes a serialized SortGen as a JSON string and prompts the user to save it to disk.
     */
    function save(sortGenState: SerializableSortGenState) {
      const jsonString = JSON.stringify(sortGenState);
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
     */
    function onclick(betterThan: boolean) {
      // We do a deep copy of the save button element to remove it's event listeners
      // The alternative is passing lambdas around, which, considering how the code is structured, would be a pain.
      const newElement = serializeEl.cloneNode(true) as HTMLButtonElement;
      if (serializeEl.parentNode) {
        serializeEl.parentNode.replaceChild(newElement, serializeEl);
        serializeEl = newElement;
      } else {
        throw "Serialize button has no parent node. You shouldn't see this.";
      }

      genResult = gen.next(betterThan);
      if (genResult.done) {
        onFinish(genResult.value);
        return;
      } else {
        const { left, right, serialiseResults } = genResult.value;

        serializeEl.addEventListener("click", () => save(serialiseResults()));
        leftSongView.innerHTML = left.itemView();
        rightSongView.innerHTML = right.itemView();
      }
    }

    /**
     * Performs cleanup and shows results list.
     */
    function onFinish(finalState: SongInterface[]) {
      mainViewEl.style.display = "none";
      serializeEl.style.display = "none";
      resultsEl.style.display = "block";

      for (let item of finalState) {
        let listElement = document.createElement("li");
        listElement.innerHTML = item.listItem();
        resultsEl.appendChild(listElement);
      }
    }

    //Setup DOM
    headerTextEl.innerHTML = "Which song is better?";
    mainViewEl.style.display = "grid";
    serializeEl.style.display = "inline";
    toHideEl.style.display = "none";

    // Get first two songs to compare.
    let genResult = gen.next();
    let { left, right, serialiseResults } = genResult.value;
    serializeEl.addEventListener("click", () => save(serialiseResults()));

    leftSongView.innerHTML = left.itemView();
    rightSongView.innerHTML = right.itemView();

    // Setup event listeners.
    leftButton.addEventListener("click", () => onclick(true));
    rightButton.addEventListener("click", () => onclick(false));
  }
  playlistURLEl.addEventListener("keypress", function (event: KeyboardEvent) {
    if (event.key === "Enter") {
      playlistUrlButtonEl.click();
    }
  });
  playlistUrlButtonEl.addEventListener("click", async () => {
    errorTextEl.innerHTML = "";
    const songs = urlDispatch();
    const algoType: string = sortingAlgorithmEl.value;
    console.log(playlistUrlButtonEl);
    console.log(algoType);
    if (inSortGenTypes(algoType)) {
      const gen = sortGenDispatch(songs, algoType);
      main(gen);
    } else {
      throw "Sorting algorithm element is set to an unsupported value. You shouldn't see this.";
    }
  });

  deserializeEl.addEventListener("change", async function () {
    if (this.files !== null && this.files[0] != null) {
      const file = this.files[0];
      const gen = deserialize(file);
      main(gen);
    } else {
      throw "No File selected";
    }
  });
});

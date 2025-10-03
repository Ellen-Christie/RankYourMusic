const emptyNode = Symbol("emptyNode");

class bTree {
    constructor(entry, left = emptyNode, right = emptyNode) {
        this.entry = entry;
        this.left = left;
        this.right = right;
    }
}

class youtubeVideo {
    #title
    #videoId
    constructor(title, videoId) {
        this.#title = title
        this.#videoId = videoId
    }
    itemView() {
        return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${this.#videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
         <p>${this.#title}</p>`
    }
    listItem() {
        return this.#title
    }
}
function balancebTree(tree) {
    return listtobTree(bTreetoList(tree))
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
            let leftTree = leftResult[0]
            let nonLeftElts = leftResult[1];
            let rightSize = n - (leftSize + 1);
            let thisEntry = nonLeftElts[0];
            let rightResult = partialTree(nonLeftElts.slice(1), rightSize);
            let rightTree = rightResult[0]
            let remainingElts = rightResult[1];
            return [new bTree(thisEntry, leftTree, rightTree), remainingElts];
        }
    }
    return partialTree(list, list.length)[0];
}

function* binaryInsertionOrder(toOrder) {
    let state = new bTree(toOrder[0])
    console.log(toOrder)
    for (let toInsert of toOrder.slice(1)) {
        function* insert(tree) {
            let betterThan = yield [toInsert, tree.entry]
            if (betterThan === true) {
                if (tree.left === emptyNode) {
                    tree.left = new bTree(toInsert)
                } else {
                    yield* insert(tree.left)
                }
            } else {
                if (tree.right === emptyNode) {
                    tree.right = new bTree(toInsert)
                } else {
                    yield* insert(tree.right)
                }
            }
        }
        yield* insert(state)
        let temp = balancebTree(state)
        state = temp
    }
    return bTreetoList(state)
}


function* mergeOrder(toOrder) {
    function* merge(array, low, mid, high) {
        let copy = [...array]
        let leftListIndex = low
        let rightListIndex = mid + 1
        for (let index = low; index <= high; index++) {
            if (leftListIndex > mid) {
                array[index] = copy[rightListIndex]
                rightListIndex++
            }
            else if (rightListIndex > high) {
                array[index] = copy[leftListIndex]
                leftListIndex++
            } else {
                let [x, y] = [copy[leftListIndex], copy[rightListIndex]]
                let leftBetterThanRight = yield [x, y]
                if (leftBetterThanRight) {
                    array[index] = x
                    leftListIndex++
                } else {
                    array[index] = y
                    rightListIndex++
                }
            }
        }
    }
    let listLength = toOrder.length
    for (let width = 1; width < listLength; width = width * 2) {
        for (let i = 0; i < (listLength - width); i += width * 2) {
            yield* merge(toOrder, i, i + width - 1, Math.min(i + (width * 2) - 1, listLength - 1))
        }
    }
    console.log(toOrder)
    return toOrder
}

async function fileListtoSongObjects(fileList) {
    console.log(fileList)
    //The spread is to turn the filelist into a list. Because it isn't. Because historical reasons.
    //I love that this language has 20+ years of technical debt 🤩.
    let songList = [...fileList].map(async (file) => {
        let metadata = await parseBlob(file)
        return new localFile(metadata, file)
    })
    return Promise.all(songList)
}



function createGen(songList) {
    let algorithmSelection = document.querySelector("#sortingAlgorithm").value
    let gen = (algorithmSelection === "binaryInsertionSort") ? binaryInsertionOrder(songList)
        : (algorithmSelection === "mergeSort") ? mergeOrder(songList)
            : console.error("what")
    return gen
}
document.addEventListener("DOMContentLoaded", () => {
    function main(gen) {
        function onclick(betterThan) {
            genResult = gen.next(betterThan)
            if (genResult.done) {
                onFinish(genResult.value)
                return
            } else {
                let [x, y] = genResult.value
                document.querySelector("#left").innerHTML = x.itemView()
                document.querySelector("#right").innerHTML = y.itemView()
            }
        }
        function onFinish(finalState) {
            document.querySelector("#leftButton").disabled = true
            document.querySelector("#rightButton").disabled = true

            for (let item of finalState) {
                let listElement = document.createElement('li')
                listElement.innerHTML = item.listItem()
                document.querySelector('#results').appendChild(listElement)
            }

            let [x, y] = genResult.value
            document.querySelector("#left").innerHTML = x.itemView()
            document.querySelector("#right").innerHTML = y.itemView()
        }

        document.querySelector("#leftButton").disabled = false
        document.querySelector("#rightButton").disabled = false
        document.querySelector("#upload").disabled = true
        document.querySelector("#sortingAlgorithm").disabled = true
        document.querySelector("#playlistUrl").disabled = true
        document.querySelector("#playlistUrlButton").disabled = true

        let genResult = gen.next()
        let [x, y] = genResult.value
        document.querySelector("#left").innerHTML = x.itemView()
        document.querySelector("#right").innerHTML = y.itemView()

        document.querySelector("#leftButton").addEventListener("click", () => onclick(true))
        document.querySelector("#rightButton").addEventListener("click", () => onclick(false))
    }

    document.querySelector("#upload").addEventListener("change", async function () {
        document.querySelector("#errorText").innerHTML = ""
        if (!this.files || [...this.files].length <= 2) {
            document.querySelector("#errorText").innerHTML = "Please select more than 2 files to order."
            return
        } else {
            try {
                let songList = await fileListtoSongObjects(this.files)
                main(createGen(songList))
            }
            catch (error) {
                console.error(error)
                document.querySelector("#errorText").innerHTML = `${error}`
                return
            }
        }
    }, false)
    async function youtubePlaylist() {
        async function playlistURLtoSongObjects(playlistURL) {
            let params = new URLSearchParams()
            params.append("playlistID", playlistURL)
            let playlist_request = fetch(`http://127.0.0.1:5000/getplaylist?${params}`)
            let playlist_response = await playlist_request
            console.log(playlist_response)
            if (playlist_response.ok == false) {
                throw new Error((await playlist_response.json()).err)
            }
            let playlist = await playlist_response.json()
            let songs = playlist.map((item) => { return new youtubeVideo(item.title, item.videoId) })
            return Promise.all(songs)
        }
        document.querySelector("#errorText").innerHTML = ""
        let input = document.querySelector("#playlistUrl").value
        let urlMatch = input.match(/^http?s:\/\/www\.youtube\.com\/playlist\?list=(.+)/)
        if (urlMatch === null) {
            document.querySelector("#errorText").innerHTML = "Please input a valid youtube playlist URL. (NOT the url of a video in the playlist)"
            return
        } else {
            let songlist
            try {
                songlist = await playlistURLtoSongObjects(urlMatch[1])
            } catch (error) {
                console.error(error)
                document.querySelector("#errorText").innerHTML = `${error}`
                return
            }
            main(createGen(songlist))
        }
    }
    document.querySelector("#playlistUrl").addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            document.querySelector("#playlistUrlButton").click();
        }
    })
    document.querySelector("#playlistUrlButton").addEventListener("click", youtubePlaylist)
})

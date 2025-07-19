import { parseBlob } from 'music-metadata'
import { uint8ArrayToBase64 } from 'uint8array-extras'

const emptyNode = Symbol("emptyNode");

class bTree {
    constructor(entry, left = emptyNode, right = emptyNode) {
        this.entry = entry;
        this.left = left;
        this.right = right;
    }
}

class localFile {
    #title
    #albumArt
    #album
    #artist
    #file
    static urlMap = new Map()
    constructor(metadata, file) {
        console.log(metadata)
        this.#title = metadata.common.title
        this.#albumArt = metadata.common.picture[0]
        this.#album = metadata.common.album
        this.#artist = metadata.common.artist
        this.#file = file
    }
    itemView() {
        function saveandReturnURL(file) {
            let url = URL.createObjectURL(file)
            localFile.urlMap.set(file.name, url)
            return url
        }
        let url = localFile.urlMap.has(this.#file.name) ? localFile.urlMap.get(this.#file.name) : saveandReturnURL(this.#file)
        return `<img src='data:${this.#albumArt.format};base64,${uint8ArrayToBase64(this.#albumArt.data)}'/>
            <p>${this.#title}</p>
            <p>${this.#album}</p>
            <p>${this.#artist}</p>
            <audio controls>
                <source src='${url}' type='${this.#file.type}'>
                The audio stream is not supported. Are you using a supported format?
            </audio>`
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
    let songList = [...fileList].map(async (file) => {
        let metadata = await parseBlob(file)
        return new localFile(metadata, file)
    })
    return Promise.all(songList)
}


document.addEventListener("DOMContentLoaded", () => {

    function main(gen) {
        let genResult = gen.next()
        let [x, y] = genResult.value
        document.querySelector("#left").innerHTML = x.itemView()
        document.querySelector("#right").innerHTML = y.itemView()

        function onFinish(finalState) {
            document.querySelector("#leftButton").disabled = true
            document.querySelector("#rightButton").disabled = true
            console.log(finalState)
            for (let item of finalState) {
                let listElement = document.createElement('li')
                listElement.innerHTML = item.listItem()
                document.querySelector('#results').appendChild(listElement)
            }
        }
        function onclick(betterThan) {
            genResult = gen.next(betterThan)
            if (genResult.done) {
                console.log(genResult)
                console.log(genResult.value)
                onFinish(genResult.value)
                return
            }
            let [x, y] = genResult.value
            document.querySelector("#left").innerHTML = x.itemView()
            document.querySelector("#right").innerHTML = y.itemView()
        }
        document.querySelector("#leftButton").disabled = false
        document.querySelector("#rightButton").disabled = false
        document.querySelector("#upload").disabled = true
        document.querySelector("#sortingAlgorithm").disabled = true

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
                console.log(songList)
                let algorithmSelection = document.querySelector("#sortingAlgorithm").value
                if (algorithmSelection === "binaryInsertionSort") {
                    main(binaryInsertionOrder(songList))
                } else if (algorithmSelection === "mergeSort") {
                    main(mergeOrder(songList))
                } else {
                    console.log("uh oh")
                }
            }
            catch (error) {
                console.error(error)
                document.querySelector("#errorText").innerHTML = `${error}`
                return
            }
        }
    }, false)
})

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
    constructor(metadata, file) {

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
    for (let num of toOrder.slice(1)) {
        function* insert(tree) {
            let betterThan = yield [num, tree.entry, state]
            if (betterThan === true) {
                if (tree.left === emptyNode) {
                    tree.left = new bTree(num)
                } else {
                    yield* insert(tree.left)
                }
            } else {
                if (tree.right === emptyNode) {
                    tree.right = new bTree(num)
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

function* binaryInsertionOrder(toOrder) {
    function* merge(list1, list2, accumulator) {
        if (list1.length === 0) {
            return [...list2, ...accumulator]
        } else if (list2.length === 0) {
            return [...list1, ...accumulator]
        } else {
            let element1 = list1[0]
            let element2 = list2[0]
            let leftBetterThanRight = yield [element1, element2]
            if (leftBetterThanRight) {
                return yield* merge(list2.slice(1), list1, [...accumulator, element1])
            } else {
                return yield* merge(list1.slice(1), list2, [...accumulator, element2])
            }
        }
    }
    if (toOrder.length <= 1) {
        return toOrder
    } else {
        let middleIndex = Math.floor(toOrder.length / 2)
        let leftList = yield* binaryInsertionOrder(toOrder.slice(0, middleIndex))
        let rightList = yield* binaryInsertionOrder(toOrder.slice(middleIndex))
        return yield* merge(leftList, rightList, [])
    }
}

async function filestobTree(fileList, sortingMethod) {
        console.log(fileList)
        let songPromiseList = [...fileList].map(async (file) => {
            const metadata = await parseBlob(file);
            return [metadata, file]
        })
        const songList = Promise.all(songPromiseList)
        console.log(songList)
        return sortingMethod(await songList)
    }

let urlList = []
function musicBoxTemplate(songandFile) {
    let song = songandFile[0]
    let file = songandFile[1]
    let url = URL.createObjectURL(file)
    urlList.push(url)
    return `<img src='data:${song.common.picture[0].format};base64,${uint8ArrayToBase64(song.common.picture[0].data)}'/>
        <p>${song.common.title}</p>
        <p>${song.common.album}</p>
        <p>${song.common.artist}</p>
        <audio controls>
            <source src='${url}' type='${file.type}'>
            The audio stream is not supported. Are you using a supported format?
        </audio>`
}


document.addEventListener("DOMContentLoaded", () => {
    

    document.querySelector("#upload").addEventListener("change", async function() {
        document.querySelector("#errorText").innerHTML = ""
        if (!this.files || [...this.files].length <= 2) {
            document.querySelector("#errorText").innerHTML = "Please select more than 2 files to order."
            return
        }

        let gen
        try {
            let algorithmSelection = document.querySelector("#sortingAlgorithm").value
            if(algorithmSelection === "selectionSort") {
                gen = await filestobTree(this.files, binaryInsertionOrder)
            } else if(algorithmSelection === "binaryInsertionSort") {
                gen = await filestobTree(this.files, binaryInsertionOrder)
            } else {
                console.log("uh oh")
            }
        } catch (error) {
            document.querySelector("#errorText").innerHTML = `Error parsing metadata: ${error.message}`
            return
        }
        let genResult = gen.next()
        document.querySelector("#left").innerHTML = musicBoxTemplate(genResult.value[0])
        document.querySelector("#right").innerHTML = musicBoxTemplate(genResult.value[1])

        function onFinish(finalState) {
            document.querySelector("#leftButton").disabled = true
            document.querySelector("#rightButton").disabled = true
            console.log(finalState)
            for (let songandFile of finalState) {
                let song = songandFile[0]
                let listElement = document.createElement('li')
                listElement.innerHTML = song.common.title
                document.querySelector('#results').appendChild(listElement)
            }
        }
        function onclick(betterThan) {
            for (let url of urlList) {
                URL.revokeObjectURL(url)
            }
            genResult = gen.next(betterThan)
            if (genResult.done) {
                console.log(genResult)
                console.log(genResult.value)
                onFinish(genResult.value)
                return
            }
            let [x, y, state] = genResult.value
            document.querySelector("#left").innerHTML = musicBoxTemplate(x)
            document.querySelector("#right").innerHTML = musicBoxTemplate(y)
        }
        document.querySelector("#leftButton").disabled = false
        document.querySelector("#rightButton").disabled = false
        document.querySelector("#upload").disabled = true
        document.querySelector("#sortingAlgorithm").disabled = true

        document.querySelector("#leftButton").addEventListener("click", () => onclick(true))
        document.querySelector("#rightButton").addEventListener("click", () => onclick(false))
    }, false)

})

let n = 20;
const array = [];
let speedMultiplier = 1; 

myCanvas.width = 400;
myCanvas.height = 300;
const margin = 30;
let moves = [];
const cols = [];
let spacing = (myCanvas.width - margin * 2) / n;
const ctx = myCanvas.getContext("2d");

const maxColumnHeight = 200;

init();

let audioCtx = null;

document.getElementById("size-select").addEventListener("change", function() {
  n = parseInt(this.value);
  spacing = (myCanvas.width - margin * 2) / n;
  init(); 
});

document.getElementById("speed-select").addEventListener("change", function() {
  speedMultiplier = parseFloat(this.value);
});

function restart() {
  init();
  moves = [];
  animate();
}

function playNote(freq, type) {
  if (audioCtx == null) {
    audioCtx = new (window.webkitAudioContext ||
      AudioContext ||
      webkitAudioContext)();
  }
  const duration = 0.2;
  const oscillator = audioCtx.createOscillator();
  oscillator.frequency.value = freq;
  oscillator.start();
  oscillator.type = type;
  oscillator.stop(audioCtx.currentTime + duration);
  const node = audioCtx.createGain();
  node.gain.value = 0.4;
  node.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
  oscillator.connect(node);
  node.connect(audioCtx.destination);
}

function init() {
  for (let i = 0; i < n; i++) {
    array[i] = Math.random();
  }
  moves = [];
  for (let i = 0; i < n; i++) {
    const x = i * spacing + spacing / 2 + margin;
    const y = myCanvas.height - margin - i * 3;
    const width = spacing - 4;
    const height = maxColumnHeight * array[i];
    cols[i] = new Column(x, y, width, height);
  }
}

function play() {
  const selectedAlgorithm = document.getElementById("algorithm-select").value;
  if (selectedAlgorithm === "bubble") {
    moves = bubbleSort(array);
  } else if (selectedAlgorithm === "selection") {
    moves = selectionSort(array);
  } else if (selectedAlgorithm === "insertion") {
    moves = insertionSort(array);
  } else if (selectedAlgorithm === "merge") {
    moves = [];
    mergeSort(array, 0, n - 1, moves);
  } else if (selectedAlgorithm === "quick") {
    moves = [];
    quickSort(array, 0, n - 1, moves);
  }
}

function changeColorForRange(startIndex, endIndex, color) {
  for (let i = startIndex; i <= endIndex; i++) {
    cols[i].setColor(color);
  }
}

animate();

function animate() {
  ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
  let changed = false;
  for (let i = 0; i < n; i++) {
    changed = cols[i].draw(ctx) || changed;
  }
  if (!changed && moves.length > 0) {
    const move = moves.shift();
    const [i, j] = move.indices;
    const waveformType = move.swap ? "square" : "sine";
    playNote(cols[i].height + cols[j].height, waveformType);
    if (move.setColor) {
      changeColorForRange(i, j, move.setColor);
    } 
    else if(move.value){
        cols[i].height = maxColumnHeight*move.value;
    }
    else if (move.swap) {
      cols[i].moveTo(cols[j]);
      cols[j].moveTo(cols[i], -1);
      [cols[i], cols[j]] = [cols[j], cols[i]];
    } 
    else {
      if (move.highlight) {
        cols[i].jump(20, { r: 0, g: 255, b: 0 });
      } else {
        cols[i].jump();
      }
      cols[j].jump();
    }
  }
  setTimeout(() => requestAnimationFrame(animate), 1000 / (60 * speedMultiplier));
  // requestAnimationFrame(animate);
}

function bubbleSort(array) {
  const moves = [];
  do {
    var swapped = false;
    for (let i = 1; i < n; i++) {
      if (array[i - 1] > array[i]) {
        swapped = true;
        [array[i - 1], array[i]] = [array[i], array[i - 1]];
        moves.push({
          indices: [i - 1, i],
          swap: true,
          highlight: false,
        });
      } else {
        moves.push({
          indices: [i - 1, i],
          swap: false,
          highlight: false,
        });
      }
    }
  } while (swapped);
  return moves;
}

function selectionSort(array) {
  const moves = [];
  for (let i = 0; i < n - 1; i++) {
    let minIndex = i;
    for (let j = i + 1; j < n; j++) {
      moves.push({
        indices: [minIndex, j],
        swap: false,
        highlight: true,
      });
      if (array[minIndex] > array[j]) {
        minIndex = j;
      }
    }
    if (minIndex !== i) {
      [array[i], array[minIndex]] = [array[minIndex], array[i]];
      moves.push({
        indices: [i, minIndex],
        swap: true,
        highlight: false,
      });
    }
  }
  return moves;
}

function insertionSort(array) {
  const moves = [];
  for (let i = 1; i < n; i++) {
    let key = array[i];
    let j = i - 1;
    while (j >= 0 && array[j] > key) {
      moves.push({
        indices: [j, j + 1],
        swap: true,
        highlight: false,
      });
      array[j + 1] = array[j];
      j--;
    }
    array[j + 1] = key;
    moves.push({
      indices: [j + 1, i],
      swap: false,
      highlight: false,
    });
  }
  return moves;
}

function merge(arr, left, mid, right, moves) {
  const n1 = mid - left + 1;
  const n2 = right - mid;

  const L = new Array(n1);
  const R = new Array(n2);

  for (let i = 0; i < n1; i++) L[i] = arr[left + i];
  for (let j = 0; j < n2; j++) R[j] = arr[mid + 1 + j];

  let i = 0,
    j = 0;
  let k = left;

  moves.push({
    indices: [left, right],
    setColor: { r: 0, g: 0, b: 255 },
  });

  while (i < n1 && j < n2) {
    if (L[i] <= R[j]) {
      arr[k] = L[i];
      moves.push({
        indices: [k,k],
        value: arr[k],
      });
      i++;
    } else {
      arr[k] = R[j];
      moves.push({
        indices: [k,k],
        value: arr[k],
      });
      j++;
    }
    k++;
  }
  while (i < n1) {
    arr[k] = L[i];
    moves.push({
      indices: [k,k],
      value: arr[k],
    });
    i++;
    k++;
  }
  while (j < n2) {
    arr[k] = R[j];
    moves.push({
      indices: [k,k],
      value: arr[k],
    });
    j++;
    k++;
  }

  moves.push({
    indices: [left, right],
    setColor: { r: 150, g: 150, b: 150 },
  });
}

function mergeSort(arr, left, right, moves) {
  if (left >= right) return;
  const mid = Math.floor(left + (right - left) / 2);
  mergeSort(arr, left, mid, moves);
  mergeSort(arr, mid + 1, right, moves);
  merge(arr, left, mid, right, moves);
}

function partition(arr, low, high, moves) {
  const pivot = arr[high];

  moves.push({
    indices: [low, high],
    setColor: { r: 0, g: 0, b: 255 },
  });

  let i = low - 1;

  for (let j = low; j < high; j++) {
    moves.push({
      indices: [high, j],
      swap: false,
      highlight: true,
    });
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      moves.push({
        indices: [i, j],
        swap: true,
        highlight: false,
      });
    }
  }

  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  moves.push({
    indices: [i+1, high],
    swap: true,
    highlight: false,
  });

  moves.push({
    indices: [low, high],
    setColor: {r: 150, g: 150, b: 150},
  });

  return i + 1;
}

function quickSort(arr, low, high, moves) {
  if (low < high) {
    const pi = partition(arr, low, high, moves);

    quickSort(arr, low, pi - 1,moves);
    quickSort(arr, pi + 1, high, moves);
  }
}

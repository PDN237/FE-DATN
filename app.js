// Main application logic
class App {
    constructor() {
        this.array = [];
        this.boxes = [];
        this.isSorting = false;
        this.mainContainer = document.getElementById('mainContainer');
        this.numElementsInput = document.getElementById('numElements');
        this.sortTypeSelect = document.getElementById('sortType');
        this.speedSelect = document.getElementById('speed');
        this.visualizationModeSelect = document.getElementById('visualizationMode');
        this.sortBtn = document.getElementById('sortBtn');
        this.randomizeBtn = document.getElementById('randomizeBtn');
        this.currentSorter = null;
        this.descriptionElement = document.getElementById('description');
        this.codeSnippetsElement = document.getElementById('codeSnippets');
        this.codeEditor = document.getElementById('codeEditor');
        this.isEditorFocused = false;

        this.init();
        this.setupCodeEditor();
    }

    init() {

        this.randomizeBtn.addEventListener('click', () => this.randomize());
        this.sortBtn.addEventListener('click', () => this.startSort());
        this.visualizationModeSelect.addEventListener('change', () => {
            this.updateVisualizationMode();
        });

        this.numElementsInput.addEventListener('change', () => {
            if (this.isSorting) {
                // Stop sorting completely
                this.currentSorter.stop();
                this.isSorting = false;
                this.updateButtonStates();
                // Revert the change
                this.numElementsInput.value = this.array.length;
                alert('Sorting stopped. Please enter new data into the input if needed.');
            } else {
                this.randomize();
            }
        });

        this.sortTypeSelect.addEventListener('change', () => {
            if (this.isSorting) {
                // Stop sorting completely
                this.currentSorter.stop();
                this.isSorting = false;
                this.updateButtonStates();
                // Revert the change
                this.sortTypeSelect.value = this.currentSorter ? this.currentSorter.sortType : 'bubble';
                alert('Sorting stopped. Please select a new algorithm if needed.');
            } else {
                this.updateAlgorithmDescription();
                this.setupCodeEditor();
            }
        });

        this.speedSelect.addEventListener('change', () => {
            if (this.isSorting) {
                // Update the sorting speed dynamically without stopping
                const newSpeedMultiplier = parseFloat(this.speedSelect.value);
                this.currentSorter.delay = 500 / newSpeedMultiplier;
            }
        });

        // Initial randomization
        this.randomize();
        this.updateAlgorithmDescription();
    }
    
    randomize() {
        if (this.isSorting) return;

        const numElements = parseInt(this.numElementsInput.value);
        this.array = [];

        // Generate random numbers from 1 to 1000
        for (let i = 0; i < numElements; i++) {
            this.array.push(Math.floor(Math.random() * 1000) + 1);
        }

        this.renderBoxes(true); // Pass true to indicate randomization
    }
    
    renderBoxes(isRandomizing = false) {
        // Clear existing boxes
        this.mainContainer.innerHTML = '';
        this.boxes = [];

        const containerWidth = this.mainContainer.offsetWidth;
        const containerHeight = this.mainContainer.offsetHeight;
        const mode = this.visualizationModeSelect.value;

        this.array.forEach((num, index) => {
            const element = document.createElement('div');
            element.className = mode === 'bars' ? 'bar' : (mode === 'sized-boxes' ? 'sized-box' : 'box');
            element.textContent = mode === 'bars' || mode === 'sized-boxes' ? '' : num; // Hide numbers in bar and sized-box modes
            element.dataset.index = index;

            if (mode === 'bars') {
                // Calculate height proportionally
                const maxValue = Math.max(...this.array);
                const minHeight = 10;
                const maxHeight = containerHeight - 40; // Leave some space at top
                const height = Math.max(minHeight, (num / maxValue) * maxHeight);
                element.style.height = `${height}px`;
                element.style.width = '20px'; // Fixed width for bars

                // Random position for bars
                const left = Math.random() * (containerWidth - 30);
                const top = Math.random() * (containerHeight - height - 10);

                element.style.left = `${left}px`;
                element.style.top = `${top}px`;
            } else if (mode === 'sized-boxes') {
                // Calculate size proportionally for sized boxes
                const maxValue = Math.max(...this.array);
                const minSize = 20;
                const maxSize = 80;
                const size = Math.max(minSize, (num / maxValue) * maxSize);
                element.style.width = `${size}px`;
                element.style.height = `${size}px`;

                // Random position for sized boxes
                const left = Math.random() * (containerWidth - size);
                const top = Math.random() * (containerHeight - size);

                element.style.left = `${left}px`;
                element.style.top = `${top}px`;
            } else {
                // Random position for regular boxes
                const left = Math.random() * (containerWidth - 60);
                const top = Math.random() * (containerHeight - 60);

                element.style.left = `${left}px`;
                element.style.top = `${top}px`;
            }

            // Add appropriate animation based on context
            if (isRandomizing) {
                element.classList.add('sizeChanging');
            } else {
                element.style.animationDelay = `${index * 50}ms`;
            }

            this.mainContainer.appendChild(element);
            this.boxes.push(element);
        });
    }
    
    updateBoxes(array, highlightIndices = [], highlightClass = '') {
        // Clear previous highlights
        this.boxes.forEach(box => {
            box.classList.remove('comparing', 'swapping', 'sorted');
        });

        const containerWidth = this.mainContainer.offsetWidth;
        const containerHeight = this.mainContainer.offsetHeight;
        const mode = this.visualizationModeSelect.value;

        if (mode === 'bars') {
            // Arrange bars in a horizontal line from the bottom
            const barWidth = 25; // Width including gap
            const totalWidth = array.length * barWidth;
            const startX = (containerWidth - totalWidth) / 2;
            const maxValue = Math.max(...array);
            const minHeight = 10;
            const maxHeight = containerHeight - 40;

            array.forEach((num, index) => {
                const bar = this.boxes[index];
                if (bar) {
                    bar.textContent = ''; // Hide numbers in bar mode
                    const height = Math.max(minHeight, (num / maxValue) * maxHeight);
                    bar.style.height = `${height}px`;
                    bar.style.left = `${startX + index * barWidth}px`;
                    bar.style.top = `${containerHeight - height - 20}px`; // Position from bottom

                    if (highlightIndices.includes(index)) {
                        bar.classList.add(highlightClass);
                    }
                }
            });
        } else if (mode === 'sized-boxes') {
            // Arrange sized boxes in a horizontal line with optimized spacing
            const maxValue = Math.max(...array);
            const minSize = 30;
            const maxSize = 90;

            // Calculate dynamic spacing based on average size
            const avgSize = (minSize + maxSize) / 2;
            const boxSpacing = avgSize * 0.8; // 80% of average size for tighter spacing
            const totalWidth = array.length * boxSpacing;
            const startX = (containerWidth - totalWidth) / 2;
            const centerY = containerHeight / 2;

            array.forEach((num, index) => {
                const box = this.boxes[index];
                if (box) {
                    box.textContent = ''; // Hide numbers in sized-box mode
                    const size = Math.max(minSize, (num / maxValue) * maxSize);
                    box.style.width = `${size}px`;
                    box.style.height = `${size}px`;
                    box.style.left = `${startX + index * boxSpacing}px`;
                    box.style.top = `${centerY - size/2}px`;

                    if (highlightIndices.includes(index)) {
                        box.classList.add(highlightClass);
                    }
                }
            });
        } else {
            // Original box arrangement
            const boxWidth = 50;
            const totalWidth = array.length * boxWidth;
            const startX = (containerWidth - totalWidth) / 2;
            const centerY = containerHeight / 2;

            array.forEach((num, index) => {
                const box = this.boxes[index];
                if (box) {
                    box.textContent = num;
                    box.style.left = `${startX + index * boxWidth}px`;
                    box.style.top = `${centerY - 25}px`;

                    if (highlightIndices.includes(index)) {
                        box.classList.add(highlightClass);
                    }
                }
            });
        }
    }
    
    updateVisualizationMode() {
        if (this.isSorting) {
            // Update existing elements to new mode without re-randomizing
            this.boxes.forEach((element, index) => {
                const mode = this.visualizationModeSelect.value;
                element.className = mode === 'bars' ? 'bar' : (mode === 'sized-boxes' ? 'sized-box' : 'box');

                if (mode === 'bars') {
                    // Hide numbers in bar mode
                    element.textContent = '';
                    // Calculate height proportionally
                    const maxValue = Math.max(...this.array);
                    const minHeight = 10;
                    const maxHeight = this.mainContainer.offsetHeight - 40;
                    const height = Math.max(minHeight, (this.array[index] / maxValue) * maxHeight);
                    element.style.height = `${height}px`;
                    element.style.width = '20px';
                } else if (mode === 'sized-boxes') {
                    // Hide numbers and calculate size proportionally for sized boxes
                    element.textContent = '';
                    const maxValue = Math.max(...this.array);
                    const minSize = 20;
                    const maxSize = 80;
                    const size = Math.max(minSize, (this.array[index] / maxValue) * maxSize);
                    element.style.width = `${size}px`;
                    element.style.height = `${size}px`;
                } else {
                    // Show numbers in regular box mode
                    element.textContent = this.array[index];
                    element.style.width = '50px';
                    element.style.height = '50px';
                }
            });
            // Update current positions to match new mode
            this.updateBoxes(this.array);
        } else {
            this.randomize();
        }
    }

    updateButtonStates() {
        if (this.isSorting) {
            this.sortBtn.disabled = true;
            this.randomizeBtn.disabled = true;
        } else {
            this.sortBtn.disabled = false;
            this.randomizeBtn.disabled = false;
        }
    }

    async startSort() {
        const sortType = this.sortTypeSelect.value;
        const speedMultiplier = parseFloat(this.speedSelect.value);
        const delay = 500 / speedMultiplier;

        if (this.currentSorter) {
            this.currentSorter.stop();
        }

        this.isSorting = true;
        this.updateButtonStates();

        this.currentSorter = new SortVisualizer(this.array, this.updateBoxes.bind(this), delay);
        try {
            switch (sortType) {
                case 'bubble':
                    await this.currentSorter.bubbleSort();
                    break;
                case 'selection':
                    await this.currentSorter.selectionSort();
                    break;
                case 'insertion':
                    await this.currentSorter.insertionSort();
                    break;
                case 'quick':
                    await this.currentSorter.quickSort();
                    break;
                case 'merge':
                    await this.currentSorter.mergeSort();
                    break;

            }
        } catch (error) {
            console.error('Sorting error:', error);
        } finally {
            this.isSorting = false;
            this.updateButtonStates();
        }
    }

    updateAlgorithmDescription() {
        const sortType = this.sortTypeSelect.value;
        let description = '';
        let codeSnippets = {};

        switch (sortType) {

            case 'bubble':
                description = 'Bubble Sort is a simple sorting algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. The pass through the list is repeated until the list is sorted. It has a time complexity of O(n²) in the worst and average cases.';
                codeSnippets = {
                    'C': `void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n-1; i++) {
        for (int j = 0; j < n-i-1; j++) {
            if (arr[j] > arr[j+1]) {
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
    }
}`,
                    'C#': `public static void BubbleSort(int[] arr) {
    int n = arr.Length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
                    'Java': `public static void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}`,
                    'Python': `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]`,
                    'JavaScript': `function bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }
}`
                };
                break;
            case 'selection':
                description = 'Selection Sort is an in-place comparison sorting algorithm. It divides the input list into two parts: a sorted sublist of items which is built up from left to right at the front (left) of the list and a sublist of the remaining unsorted items that occupy the rest of the list. It has a time complexity of O(n²).';
                codeSnippets = {
                    'C': `void selectionSort(int arr[], int n) {
    for (int i = 0; i < n-1; i++) {
        int min_idx = i;
        for (int j = i+1; j < n; j++) {
            if (arr[j] < arr[min_idx]) {
                min_idx = j;
            }
        }
        int temp = arr[min_idx];
        arr[min_idx] = arr[i];
        arr[i] = temp;
    }
}`,
                    'C#': `public static void SelectionSort(int[] arr) {
    int n = arr.Length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        int temp = arr[minIdx];
        arr[minIdx] = arr[i];
        arr[i] = temp;
    }
}`,
                    'Java': `public static void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        int temp = arr[minIdx];
        arr[minIdx] = arr[i];
        arr[i] = temp;
    }
}`,
                    'Python': `def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]`,
                    'JavaScript': `function selectionSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];
    }
}`
                };
                break;
            case 'insertion':
                description = 'Insertion Sort is a simple sorting algorithm that builds the final sorted array one item at a time. It is much less efficient on large lists than more advanced algorithms such as quicksort, heapsort, or merge sort. It has a time complexity of O(n²) in the worst case.';
                codeSnippets = {
                    'C': `void insertionSort(int arr[], int n) {
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`,
                    'C#': `public static void InsertionSort(int[] arr) {
    int n = arr.Length;
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`,
                    'Java': `public static void insertionSort(int[] arr) {
    int n = arr.length;
    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`,
                    'Python': `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key`,
                    'JavaScript': `function insertionSort(arr) {
    const n = arr.length;
    for (let i = 1; i < n; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`
                };
                break;
            case 'quick':
                description = 'Quick Sort is a divide-and-conquer algorithm. It works by selecting a \'pivot\' element from the array and partitioning the other elements into two sub-arrays, according to whether they are less than or greater than the pivot. The sub-arrays are then sorted recursively. It has an average time complexity of O(n log n).';
                codeSnippets = {
                    'C': `void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = (low - 1);
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return (i + 1);
}`,
                    'C#': `public static void QuickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = Partition(arr, low, high);
        QuickSort(arr, low, pi - 1);
        QuickSort(arr, pi + 1, high);
    }
}

private static int Partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp2 = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp2;
    return i + 1;
}`,
                    'Java': `public static void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

private static int partition(int[] arr, int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            int temp = arr[i];
            arr[i] = arr[j];
            arr[j] = temp;
        }
    }
    int temp = arr[i + 1];
    arr[i + 1] = arr[high];
    arr[high] = temp;
    return i + 1;
}`,
                    'Python': `def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1`,
                    'JavaScript': `function quickSort(arr, low = 0, high = arr.length - 1) {
    if (low < high) {
        const pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

function partition(arr, low, high) {
    const pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
}`
                };
                break;
            case 'merge':
                description = 'Merge Sort is an efficient, stable, comparison-based, divide and conquer sorting algorithm. Most implementations produce a stable sort, which means that the order of equal elements is the same in the input and output. It has a time complexity of O(n log n).';
                codeSnippets = {
                    'C': `void mergeSort(int arr[], int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}

void merge(int arr[], int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;
    int L[n1], R[n2];
    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
    }
    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
    }
}`,
                    'C#': `public static void MergeSort(int[] arr, int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        MergeSort(arr, l, m);
        MergeSort(arr, m + 1, r);
        Merge(arr, l, m, r);
    }
}

private static void Merge(int[] arr, int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;
    int[] L = new int[n1];
    int[] R = new int[n2];
    Array.Copy(arr, l, L, 0, n1);
    Array.Copy(arr, m + 1, R, 0, n2);
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
    }
    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
    }
}`,
                    'Java': `public static void mergeSort(int[] arr, int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}

private static void merge(int[] arr, int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;
    int[] L = new int[n1];
    int[] R = new int[n2];
    System.arraycopy(arr, l, L, 0, n1);
    System.arraycopy(arr, m + 1, R, 0, n2);
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) {
            arr[k] = L[i];
            i++;
        } else {
            arr[k] = R[j];
            j++;
        }
        k++;
    }
    while (i < n1) {
        arr[k] = L[i];
        i++;
        k++;
    }
    while (j < n2) {
        arr[k] = R[j];
        j++;
        k++;
    }
}`,
                    'Python': `def merge_sort(arr):
    if len(arr) > 1:
        mid = len(arr) // 2
        L = arr[:mid]
        R = arr[mid:]
        merge_sort(L)
        merge_sort(R)
        i = j = k = 0
        while i < len(L) and j < len(R):
            if L[i] < R[j]:
                arr[k] = L[i]
                i += 1
            else:
                arr[k] = R[j]
                j += 1
            k += 1
        while i < len(L):
            arr[k] = L[i]
            i += 1
            k += 1
        while j < len(R):
            arr[k] = R[j]
            j += 1
            k += 1`,
                    'JavaScript': `function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    return merge(left, right);
}

function merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
        if (left[i] < right[j]) {
            result.push(left[i]);
            i++;
        } else {
            result.push(right[j]);
            j++;
        }
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
}`
                };
                break;
        }

        this.descriptionElement.textContent = description;
        let html = '<div class="code-viewer">';
        html += '<div class="language-tabs">';
        for (const lang of Object.keys(codeSnippets)) {
            html += `<button class="language-tab" data-lang="${lang}">${lang}</button>`;
        }
        html += '</div>';
        html += '<div class="code-display"><pre id="code-content"></pre></div>';
        html += '</div>';
        this.codeSnippetsElement.innerHTML = html;

        // Add tab functionality
        const tabs = this.codeSnippetsElement.querySelectorAll('.language-tab');
        const codeContent = this.codeSnippetsElement.querySelector('#code-content');
        const languageMap = {
            'C': 'c',
            'C#': 'csharp',
            'Java': 'java',
            'Python': 'python',
            'JavaScript': 'javascript'
        };

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const lang = tab.dataset.lang;
                const prismLang = languageMap[lang];
                codeContent.innerHTML = `<code class="language-${prismLang}">${codeSnippets[lang]}</code>`;
                Prism.highlightElement(codeContent.querySelector('code'));
            });
        });
        // Set first tab as active
        if (tabs.length > 0) {
            tabs[0].classList.add('active');
            const firstLang = Object.keys(codeSnippets)[0];
            const prismLang = languageMap[firstLang];
            codeContent.innerHTML = `<code class="language-${prismLang}">${codeSnippets[firstLang]}</code>`;
            Prism.highlightElement(codeContent.querySelector('code'));
        }

        // Keep code editor empty for custom sort
        this.codeEditor.value = '';
    }

    setupCodeEditor() {
        // Initial setup is handled in updateAlgorithmDescription
        this.codeEditor.addEventListener('focus', () => {
            this.isEditorFocused = true;
            this.updateCodeSnippetsVisibility();
        });
        this.codeEditor.addEventListener('blur', () => {
            this.isEditorFocused = false;
            this.updateCodeSnippetsVisibility();
        });
    }

    updateCodeSnippetsVisibility() {
        if (!this.isEditorFocused) {
            this.codeSnippetsElement.style.visibility = 'visible';
        } else {
            this.codeSnippetsElement.style.visibility = 'hidden';
        }
    }

    async runCustomSort() {
        const code = this.codeEditor.value;
        // Extract the function body
        const body = code.replace(/function\s+customSort\s*\([^)]*\)\s*\{/, '').replace(/\}\s*$/, '');
        const func = new Function('arr', 'highlight', 'sleep', body);

        const highlight = (indices, className) => {
            this.updateBoxes(this.array, indices, className);
        };

        const sleep = () => new Promise(resolve => setTimeout(resolve, this.delay));

        await func(this.array, highlight, sleep);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});

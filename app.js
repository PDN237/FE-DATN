// Main application logic
class App {
    constructor() {
        this.array = [];
        this.boxes = [];
        this.isSorting = false;
        this.isPaused = false;
        this.mainContainer = document.getElementById('mainContainer');
        this.numElementsInput = document.getElementById('numElements');
        this.sortTypeSelect = document.getElementById('sortType');
        this.speedSelect = document.getElementById('speed');
        this.visualizationModeSelect = document.getElementById('visualizationMode');
        this.sortBtn = document.getElementById('sortBtn');
        this.randomizeBtn = document.getElementById('randomizeBtn');
        this.currentSorter = null;
        this.descriptionElement = document.getElementById('description');
        this.comparePopup = null;
        this.currentCodeSnippets = null;

        this.init();
        this.setupKeyboardShortcuts();
        this.updateAlgorithmDescription(); // Initialize with default algorithm
    }

    init() {
        this.randomizeBtn.addEventListener('click', () => this.randomize());
        this.sortBtn.addEventListener('click', () => this.toggleSort());
        this.numElementsInput.addEventListener('change', () => {
            if (this.isSorting) {
                // Stop sorting completely
                this.currentSorter.stop();
                this.isSorting = false;
                this.updateButtonStates();
                // Revert the change
                this.numElementsInput.value = this.array.length;
                alert('Đã dừng sắp xếp. Vui lòng nhập dữ liệu mới vào ô nhập liệu nếu cần.');
            } else {
                this.randomize();
            }
        });

        this.sortTypeSelect.addEventListener('change', () => {
            this.updateAlgorithmDescription();
        });

        this.visualizationModeSelect.addEventListener('change', () => {
            this.updateVisualizationMode();
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

    showComparePopup(index1, index2) {
        if (!this.boxes[index1] || !this.boxes[index2]) return;

        if (this.comparePopup) {
            this.comparePopup.remove();
        }

        const box1 = this.boxes[index1];
        const box2 = this.boxes[index2];

        const value1 = this.array[index1];
        const value2 = this.array[index2];

        const rect1 = box1.getBoundingClientRect();
        const rect2 = box2.getBoundingClientRect();
        const containerRect = this.mainContainer.getBoundingClientRect();

        const center1 = rect1.left - containerRect.left + (rect1.width / 2);
        const center2 = rect2.left - containerRect.left + (rect2.width / 2);

        const popupCenterX = (center1 + center2) / 2;

        const popup = document.createElement("div");
        popup.className = "compare-popup";

        popup.innerHTML = `
            <div class="compare-label">Đang so sánh</div>
            <div class="compare-values">
                <div class="compare-value left">${value1}</div>
                <div class="compare-operator">với</div>
                <div class="compare-value right">${value2}</div>
            </div>
            <div class="compare-result">
                ${value1 > value2 ? `${value1} > ${value2}` : (value1 < value2 ? `${value1} < ${value2}` : `${value1} = ${value2}`)}
            </div>
        `;

        this.mainContainer.appendChild(popup);

        const popupWidth = popup.offsetWidth;

        popup.style.left = `${popupCenterX - popupWidth / 2}px`;
        popup.style.top = `${rect1.top - containerRect.top - 100}px`;

        this.comparePopup = popup;

        // Highlight the boxes being compared
        box1.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        box2.style.transition = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
        box1.style.transform = 'scale(1.2) translateY(-12px)';
        box2.style.transform = 'scale(1.2) translateY(-12px)';
        box1.style.boxShadow = '0 12px 28px rgba(239, 68, 68, 0.6)';
        box2.style.boxShadow = '0 12px 28px rgba(239, 68, 68, 0.6)';

        setTimeout(() => {
            if (this.comparePopup) {
                this.comparePopup.remove();
                this.comparePopup = null;
            }

            box1.style.transform = '';
            box2.style.transform = '';
            box1.style.boxShadow = '';
            box2.style.boxShadow = '';
        }, 1400);
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
        // Xóa màu cũ trước
        this.boxes.forEach(box => {
            box.classList.remove(
                'comparing',
                'swapping',
                'sorted',
                'pivot'
            );
        });

        const containerWidth = this.mainContainer.offsetWidth;
        const containerHeight = this.mainContainer.offsetHeight;
        const mode = this.visualizationModeSelect.value;

        const applyHighlight = (element, index) => {
            if (highlightIndices.includes(index)) {
                element.classList.add(highlightClass);

                if (
                    highlightClass === "swapping" &&
                    highlightIndices.length === 2
                ) {
                    this.animateSwap(
                        highlightIndices[0],
                        highlightIndices[1]
                    );
                }

                if (
                    highlightClass === "comparing" &&
                    highlightIndices.length === 2
                ) {
                    this.showComparePopup(
                        highlightIndices[0],
                        highlightIndices[1]
                    );
                }
            }
        };

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

                    applyHighlight(bar, index);
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

                    applyHighlight(box, index);
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

                    applyHighlight(box, index);
                }
            });
        }
    }

    animateSwap(index1, index2) {
        const box1 = this.boxes[index1];
        const box2 = this.boxes[index2];
        const mode = this.visualizationModeSelect.value;

        if (!box1 || !box2) return;

        // Fast and smooth swap animation
        const duration = 0.15; // Faster animation
        box1.style.transition = `transform ${duration}s ease, box-shadow ${duration}s ease`;
        box2.style.transition = `transform ${duration}s ease, box-shadow ${duration}s ease`;

        requestAnimationFrame(() => {
            if (mode === 'bars') {
                // Bars: Quick horizontal movement
                box1.style.transform = "translateX(20px) scale(1.08)";
                box2.style.transform = "translateX(-20px) scale(1.08)";
            } else if (mode === 'sized-boxes') {
                // Sized boxes: Quick rotation
                box1.style.transform = "rotate(20deg) scale(1.1) translateY(-12px)";
                box2.style.transform = "rotate(-20deg) scale(1.1) translateY(-12px)";
            } else {
                // Regular boxes: Quick bounce
                box1.style.transform = "translateY(-30px) scale(1.1)";
                box2.style.transform = "translateY(-30px) scale(1.1)";
            }

            box1.style.boxShadow = "0 12px 24px rgba(247, 183, 49, 0.6)";
            box2.style.boxShadow = "0 12px 24px rgba(247, 183, 49, 0.6)";

            setTimeout(() => {
                box1.style.transform = "";
                box2.style.transform = "";
                box1.style.boxShadow = "";
                box2.style.boxShadow = "";
            }, duration * 1000);
        });
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

    toggleSort() {
        if (this.isSorting) {
            if (this.isPaused) {
                // Resume
                this.isPaused = false;
                this.sortBtn.textContent = 'Tạm dừng';
                this.currentSorter.resume();
            } else {
                // Pause
                this.isPaused = true;
                this.sortBtn.textContent = 'Tiếp tục';
                this.currentSorter.pause();
                this.enableArrayEditing();
            }
        } else {
            // Start new sort
            this.startSort();
        }
    }

    startSort() {
        this.isSorting = true;
        this.isPaused = false;
        this.sortBtn.textContent = 'Tạm dừng';
        this.randomizeBtn.disabled = true;
        this.numElementsInput.disabled = true;
        this.sortTypeSelect.disabled = true;
        this.visualizationModeSelect.disabled = true;

        // Fix positions before starting sort to avoid jump
        this.updateBoxes(this.array);

        const sortType = this.sortTypeSelect.value;
        const speed = parseFloat(this.speedSelect.value);
        const delay = 1000 / speed; // Increased from 500 to 1500 to match slower comparison animation

        this.currentSorter = new SortVisualizer(this.array, (array, highlightIndices, highlightClass) => {
            this.updateBoxes(array, highlightIndices, highlightClass);
        }, delay);

        switch (sortType) {
            case 'bubble':
                this.currentSorter.bubbleSort();
                break;
            case 'selection':
                this.currentSorter.selectionSort();
                break;
            case 'insertion':
                this.currentSorter.insertionSort();
                break;
            case 'quick':
                this.currentSorter.quickSort(0, this.array.length - 1);
                break;
            case 'merge':
                this.currentSorter.mergeSort(0, this.array.length - 1);
                break;
        }

        this.currentSorter.sortingPromise.then(() => {
            this.finishSorting();
        });
    }

    finishSorting() {
        this.isSorting = false;
        this.isPaused = false;
        this.sortBtn.textContent = 'Sắp xếp';
        this.randomizeBtn.disabled = false;
        this.numElementsInput.disabled = false;
        this.sortTypeSelect.disabled = false;
        this.visualizationModeSelect.disabled = false;

        // Celebration animation
        this.celebrateCompletion();
    }

    celebrateCompletion() {
        // Add celebration animation to all boxes
        this.boxes.forEach((box, index) => {
            setTimeout(() => {
                box.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
                box.style.transform = 'scale(1.15)';
                box.style.boxShadow = '0 0 25px rgba(72, 199, 142, 0.7)';
                
                setTimeout(() => {
                    box.style.transform = 'scale(1)';
                    box.style.boxShadow = '';
                }, 300);
            }, index * 25);
        });
    }

    // Array editing when paused
    enableArrayEditing() {
        this.boxes.forEach((box, index) => {
            box.style.cursor = 'pointer';
            box.title = 'Nhấp để chỉnh giá trị';
            box.addEventListener('click', () => this.editBoxValue(index));
        });
    }

    disableArrayEditing() {
        this.boxes.forEach(box => {
            box.style.cursor = '';
            box.title = '';
            box.removeEventListener('click', this.editBoxValue);
        });
    }

    editBoxValue(index) {
        if (!this.isPaused) return;

        const newValue = prompt('Nhập giá trị mới:', this.array[index]);
        if (newValue !== null && !isNaN(newValue)) {
            this.array[index] = parseInt(newValue);
            this.boxes[index].textContent = this.visualizationModeSelect.value === 'boxes' ? this.array[index] : '';
            this.updateBoxes(this.array);
        }
    }

    // Keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch(e.key) {
                case ' ':
                    e.preventDefault();
                    this.toggleSort();
                    break;
                case 'r':
                case 'R':
                    if (!this.isSorting) this.randomize();
                    break;
                case 'Escape':
                    if (this.isSorting) {
                        this.currentSorter.stop();
                        this.finishSorting();
                    }
                    break;
            }
        });
    }

    updateButtonStates() {
        this.randomizeBtn.disabled = this.isSorting;
        this.numElementsInput.disabled = this.isSorting;
        this.sortTypeSelect.disabled = this.isSorting;
        this.visualizationModeSelect.disabled = this.isSorting;
    }

    updateAlgorithmDescription() {
        const sortType = this.sortTypeSelect.value;
        
        // Algorithm descriptions
        const descriptions = {
            'bubble': 'Bubble Sort là thuật toán sắp xếp đơn giản nhất. Nó lặp đi lặp lại qua danh sách, so sánh các phần tử liền kề và hoán đổi chúng nếu chúng sai thứ tự. Quá trình này lặp lại cho đến khi không cần hoán đổi nào nữa, nghĩa là danh sách đã được sắp xếp.',
            'selection': 'Selection Sort chia danh sách thành hai phần: phần đã sắp xếp (ở đầu) và phần chưa sắp xếp (ở cuối). Thuật toán tìm phần tử nhỏ nhất trong phần chưa sắp xếp và đưa nó vào phần đã sắp xếp.',
            'insertion': 'Insertion Sort xây dựng danh sách đã sắp xếp một phần tử tại một thời điểm. Nó lấy mỗi phần tử từ danh sách đầu vào và chèn nó vào vị trí đúng trong danh sách đã sắp xếp.',
            'quick': 'Quick Sort là thuật toán chia để trị (divide and conquer). Nó chọn một phần tử làm pivot và chia mảng thành hai phần: các phần tử nhỏ hơn pivot và các phần tử lớn hơn pivot, sau đó sắp xếp đệ quy từng phần.',
            'merge': 'Merge Sort là thuật toán chia để trị ổn định. Nó chia mảng thành hai nửa, sắp xếp đệ quy từng nửa, sau đó gộp hai nửa đã sắp xếp lại thành một mảng hoàn chỉnh.'
        };
        
        // Complexity data
        const complexityData = {
            'bubble': {
                best: 'O(n)',
                bestDesc: 'Khi mảng đã sắp xếp',
                avg: 'O(n²)',
                avgDesc: 'Trung bình',
                worst: 'O(n²)',
                worstDesc: 'Khi mảng ngược thứ tự',
                space: 'O(1)',
                spaceDesc: 'Không cần bộ nhớ phụ'
            },
            'selection': {
                best: 'O(n²)',
                bestDesc: 'Luôn duyệt toàn bộ',
                avg: 'O(n²)',
                avgDesc: 'Trung bình',
                worst: 'O(n²)',
                worstDesc: 'Luôn duyệt toàn bộ',
                space: 'O(1)',
                spaceDesc: 'Không cần bộ nhớ phụ'
            },
            'insertion': {
                best: 'O(n)',
                bestDesc: 'Khi mảng đã sắp xếp',
                avg: 'O(n²)',
                avgDesc: 'Trung bình',
                worst: 'O(n²)',
                worstDesc: 'Khi mảng ngược thứ tự',
                space: 'O(1)',
                spaceDesc: 'Không cần bộ nhớ phụ'
            },
            'quick': {
                best: 'O(n log n)',
                bestDesc: 'Khi pivot chia đều',
                avg: 'O(n log n)',
                avgDesc: 'Trung bình',
                worst: 'O(n²)',
                worstDesc: 'Khi pivot xấu nhất',
                space: 'O(log n)',
                spaceDesc: 'Stack đệ quy'
            },
            'merge': {
                best: 'O(n log n)',
                bestDesc: 'Luôn chia đều',
                avg: 'O(n log n)',
                avgDesc: 'Trung bình',
                worst: 'O(n log n)',
                worstDesc: 'Luôn chia đều',
                space: 'O(n)',
                spaceDesc: 'Mảng phụ'
            }
        };
        
        // Update description
        if (this.descriptionElement) {
            this.descriptionElement.textContent = descriptions[sortType] || '';
        }
        
        // Update complexity
        const data = complexityData[sortType];
        if (data) {
            document.getElementById('bestCase').textContent = data.best;
            document.getElementById('bestCaseDesc').textContent = data.bestDesc;
            document.getElementById('avgCase').textContent = data.avg;
            document.getElementById('avgCaseDesc').textContent = data.avgDesc;
            document.getElementById('worstCase').textContent = data.worst;
            document.getElementById('worstCaseDesc').textContent = data.worstDesc;
            document.getElementById('spaceCase').textContent = data.space;
            document.getElementById('spaceCaseDesc').textContent = data.spaceDesc;
        }
        
        // Update code snippets
        this.updateCodeSnippets(sortType);
        
        // Setup language tabs
        this.setupLanguageTabs();
    }
    
    updateCodeSnippets(sortType) {
        const codeSnippets = {
            'bubble': {
                cpp: `void bubbleSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
            }
        }
    }
}`,
                java: `void bubbleSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }`,
                python: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]`,
                javascript: `function bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            }
        }
    }`,
                csharp: `void BubbleSort(int[] arr) {
    int n = arr.Length;
    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }`,
                go: `func bubbleSort(arr []int) {
    n := len(arr)
    for i := 0; i < n - 1; i++ {
        for j := 0; j < n - i - 1; j++ {
            if arr[j] > arr[j + 1] {
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
            }
        }
    }
}`
            },
            'selection': {
                cpp: `void selectionSort(int arr[], int n) {
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        swap(arr[i], arr[minIdx]);
    }
}`,
                java: `void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        int temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
    }
}`,
                python: `def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]`,
                javascript: `function selectionSort(arr) {
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
}`,
                csharp: `void SelectionSort(int[] arr) {
    int n = arr.Length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        int temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
    }
}`,
                go: `func selectionSort(arr []int) {
    n := len(arr)
    for i := 0; i < n - 1; i++ {
        minIdx := i
        for j := i + 1; j < n; j++ {
            if arr[j] < arr[minIdx] {
                minIdx = j
            }
        }
        arr[i], arr[minIdx] = arr[minIdx], arr[i]
    }
}`
            },
            'insertion': {
                cpp: `void insertionSort(int arr[], int n) {
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
                java: `void insertionSort(int[] arr) {
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
                python: `def insertion_sort(arr):
    for i in range(1, len(arr)):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key`,
                javascript: `function insertionSort(arr) {
    const n = arr.length;
    for (let i = 1; i < n; i++) {
        const key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}`,
                csharp: `void InsertionSort(int[] arr) {
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
                go: `func insertionSort(arr []int) {
    n := len(arr)
    for i := 1; i < n; i++ {
        key := arr[i]
        j := i - 1
        for j >= 0 && arr[j] > key {
            arr[j + 1] = arr[j]
            j--
        }
        arr[j + 1] = key
    }
}`
            },
            'quick': {
                cpp: `int partition(int arr[], int low, int high) {
    int pivot = arr[high];
    int i = low - 1;
    for (int j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            swap(arr[i], arr[j]);
        }
    }
    swap(arr[i + 1], arr[high]);
    return i + 1;
}

void quickSort(int arr[], int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`,
                java: `int partition(int[] arr, int low, int high) {
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
}

void quickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`,
                python: `def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] < pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1

def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi - 1)
        quick_sort(arr, pi + 1, high)`,
                javascript: `function partition(arr, low, high) {
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
}

function quickSort(arr, low, high) {
    if (low < high) {
        const pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}`,
                csharp: `int Partition(int[] arr, int low, int high) {
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
}

void QuickSort(int[] arr, int low, int high) {
    if (low < high) {
        int pi = Partition(arr, low, high);
        QuickSort(arr, low, pi - 1);
        QuickSort(arr, pi + 1, high);
    }
}`,
                go: `func partition(arr []int, low, high int) int {
    pivot := arr[high]
    i := low - 1
    for j := low; j < high; j++ {
        if arr[j] < pivot {
            i++
            arr[i], arr[j] = arr[j], arr[i]
        }
    }
    arr[i + 1], arr[high] = arr[high], arr[i + 1]
    return i + 1
}

func quickSort(arr []int, low, high int) {
    if low < high {
        pi := partition(arr, low, high)
        quickSort(arr, low, pi - 1)
        quickSort(arr, pi + 1, high)
    }
}`
            },
            'merge': {
                cpp: `void merge(int arr[], int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;
    int L[n1], R[n2];
    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) arr[k++] = L[i++];
        else arr[k++] = R[j++];
    }
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
}

void mergeSort(int arr[], int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}`,
                java: `void merge(int[] arr, int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;
    int[] L = new int[n1];
    int[] R = new int[n2];
    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) arr[k++] = L[i++];
        else arr[k++] = R[j++];
    }
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
}

void mergeSort(int[] arr, int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}`,
                python: `def merge(arr, l, m, r):
    n1 = m - l + 1
    n2 = r - m
    L = arr[l:m + 1]
    R = arr[m + 1:r + 1]
    i = j = 0
    k = l
    while i < n1 and j < n2:
        if L[i] <= R[j]:
            arr[k] = L[i]
            i += 1
        else:
            arr[k] = R[j]
            j += 1
        k += 1
    while i < n1:
        arr[k] = L[i]
        i += 1
        k += 1
    while j < n2:
        arr[k] = R[j]
        j += 1
        k += 1

def merge_sort(arr, l, r):
    if l < r:
        m = (l + r) // 2
        merge_sort(arr, l, m)
        merge_sort(arr, m + 1, r)
        merge(arr, l, m, r)`,
                javascript: `function merge(arr, l, m, r) {
    const n1 = m - l + 1;
    const n2 = r - m;
    const L = arr.slice(l, m + 1);
    const R = arr.slice(m + 1, r + 1);
    let i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) arr[k++] = L[i++];
        else arr[k++] = R[j++];
    }
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
}

function mergeSort(arr, l, r) {
    if (l < r) {
        const m = Math.floor((l + r) / 2);
        mergeSort(arr, l, m);
        mergeSort(arr, m + 1, r);
        merge(arr, l, m, r);
    }
}`,
                csharp: `void Merge(int[] arr, int l, int m, int r) {
    int n1 = m - l + 1;
    int n2 = r - m;
    int[] L = new int[n1];
    int[] R = new int[n2];
    for (int i = 0; i < n1; i++) L[i] = arr[l + i];
    for (int j = 0; j < n2; j++) R[j] = arr[m + 1 + j];
    int i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        if (L[i] <= R[j]) arr[k++] = L[i++];
        else arr[k++] = R[j++];
    }
    while (i < n1) arr[k++] = L[i++];
    while (j < n2) arr[k++] = R[j++];
}

void MergeSort(int[] arr, int l, int r) {
    if (l < r) {
        int m = l + (r - l) / 2;
        MergeSort(arr, l, m);
        MergeSort(arr, m + 1, r);
        Merge(arr, l, m, r);
    }
}`,
                go: `func merge(arr []int, l, m, r int) {
    n1 := m - l + 1
    n2 := r - m
    L := make([]int, n1)
    R := make([]int, n2)
    for i := 0; i < n1; i++ {
        L[i] = arr[l + i]
    }
    for j := 0; j < n2; j++ {
        R[j] = arr[m + 1 + j]
    }
    i, j, k := 0, 0, l
    for i < n1 && j < n2 {
        if L[i] <= R[j] {
            arr[k] = L[i]
            i++
        } else {
            arr[k] = R[j]
            j++
        }
        k++
    }
    for i < n1 {
        arr[k] = L[i]
        i++
        k++
    }
    for j < n2 {
        arr[k] = R[j]
        j++
        k++
    }
}

func mergeSort(arr []int, l, r int) {
    if l < r {
        m := l + (r - l) / 2
        mergeSort(arr, l, m)
        mergeSort(arr, m + 1, r)
        merge(arr, l, m, r)
    }
}`
            }
        };
        
        this.currentCodeSnippets = codeSnippets[sortType];
        this.displayCode('cpp'); // Default to C++
    }
    
    setupLanguageTabs() {
        const tabs = document.querySelectorAll('.lang-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                const lang = e.target.dataset.lang;
                this.displayCode(lang);
            });
        });
    }
    
    displayCode(lang) {
        const codeContent = document.getElementById('codeContent');
        if (codeContent && this.currentCodeSnippets) {
            codeContent.textContent = this.currentCodeSnippets[lang] || '';
            codeContent.className = `language-${lang}`;
            if (typeof Prism !== 'undefined') {
                Prism.highlightElement(codeContent);
            }
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});

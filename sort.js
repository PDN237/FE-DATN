// Sorting algorithms with animation steps
class SortVisualizer {
    constructor(array, updateCallback, delay) {
        this.array = [...array];
        this.updateCallback = updateCallback;
        this.delay = delay;
        this.isSorting = false;
        this.stopped = false;
    }

    stop() {
        this.stopped = true;
    }

    async sleep() {
        return new Promise(resolve => setTimeout(resolve, this.delay));
    }

    async bubbleSort() {
        this.isSorting = true;
        const n = this.array.length;
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                if (this.stopped) return;
                this.updateCallback(this.array, [j, j + 1], 'comparing');
                await this.sleep();
                
                if (this.array[j] > this.array[j + 1]) {
                    [this.array[j], this.array[j + 1]] = [this.array[j + 1], this.array[j]];
                    this.updateCallback(this.array, [j, j + 1], 'swapping');
                    await this.sleep();
                }
            }
            this.updateCallback(this.array, [n - i - 1], 'sorted');
        }
        this.updateCallback(this.array, [0], 'sorted');
        this.isSorting = false;
    }

    async selectionSort() {
        this.isSorting = true;
        const n = this.array.length;
        for (let i = 0; i < n - 1; i++) {
            let minIdx = i;
            for (let j = i + 1; j < n; j++) {
                if (this.stopped) return;
                this.updateCallback(this.array, [minIdx, j], 'comparing');
                await this.sleep();
                
                if (this.array[j] < this.array[minIdx]) {
                    minIdx = j;
                }
            }
            if (minIdx !== i) {
                [this.array[i], this.array[minIdx]] = [this.array[minIdx], this.array[i]];
                this.updateCallback(this.array, [i, minIdx], 'swapping');
                await this.sleep();
            }
            this.updateCallback(this.array, [i], 'sorted');
        }
        this.updateCallback(this.array, [n - 1], 'sorted');
        this.isSorting = false;
    }

    async insertionSort() {
        this.isSorting = true;
        const n = this.array.length;
        for (let i = 1; i < n; i++) {
            let key = this.array[i];
            let j = i - 1;
            
            while (j >= 0 && this.array[j] > key) {
                if (this.stopped) return;
                this.updateCallback(this.array, [j, j + 1], 'comparing');
                await this.sleep();
                
                this.array[j + 1] = this.array[j];
                this.updateCallback(this.array, [j, j + 1], 'swapping');
                await this.sleep();
                j--;
            }
            this.array[j + 1] = key;
            this.updateCallback(this.array, [j + 1], 'sorted');
        }
        this.isSorting = false;
    }

    async quickSort(left = 0, right = this.array.length - 1) {
        if (left < right) {
            let pivotIndex = await this.partition(left, right);
            await this.quickSort(left, pivotIndex - 1);
            await this.quickSort(pivotIndex + 1, right);
        }
        if (left === 0 && right === this.array.length - 1) {
            this.isSorting = false;
        }
    }

    async partition(left, right) {
        let pivot = this.array[right];
        let i = left - 1;
        
        for (let j = left; j < right; j++) {
            if (this.stopped) return;
            this.updateCallback(this.array, [j, right], 'comparing');
            await this.sleep();
            
            if (this.array[j] < pivot) {
                i++;
                [this.array[i], this.array[j]] = [this.array[i], this.array[j]];
                this.updateCallback(this.array, [i, j], 'swapping');
                await this.sleep();
            }
        }
        [this.array[i + 1], this.array[right]] = [this.array[right], this.array[i + 1]];
        this.updateCallback(this.array, [i + 1, right], 'swapping');
        await this.sleep();
        
        return i + 1;
    }

    async mergeSort(left = 0, right = this.array.length - 1) {
        if (left < right) {
            const mid = Math.floor((left + right) / 2);
            await this.mergeSort(left, mid);
            await this.mergeSort(mid + 1, right);
            await this.merge(left, mid, right);
        }
        if (left === 0 && right === this.array.length - 1) {
            this.isSorting = false;
        }
    }

    async merge(left, mid, right) {
        const n1 = mid - left + 1;
        const n2 = right - mid;
        const L = this.array.slice(left, mid + 1);
        const R = this.array.slice(mid + 1, right + 1);
        
        let i = 0, j = 0, k = left;
        
        while (i < n1 && j < n2) {
            if (this.stopped) return;
            this.updateCallback(this.array, [left + i, mid + 1 + j], 'comparing');
            await this.sleep();
            
            if (L[i] <= R[j]) {
                this.array[k] = L[i];
                i++;
            } else {
                this.array[k] = R[j];
                j++;
            }
            this.updateCallback(this.array, [k], 'swapping');
            await this.sleep();
            k++;
        }
        
        while (i < n1) {
            if (this.stopped) return;
            this.array[k] = L[i];
            this.updateCallback(this.array, [k], 'swapping');
            await this.sleep();
            i++;
            k++;
        }
        
        while (j < n2) {
            if (this.stopped) return;
            this.array[k] = R[j];
            this.updateCallback(this.array, [k], 'swapping');
            await this.sleep();
            j++;
            k++;
        }
    }
}

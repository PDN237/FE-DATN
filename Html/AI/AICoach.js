let step = 1;
let selectedAlgo = "";
let selectedLang = "";
let hintShown = false;
let analysisResult = null;
let userCode = "";
let currentInput = [];
let hintLevel = 0;

function generateRandomArray() {
  const size = Math.floor(Math.random() * 6) + 4; // 4-9 phần tử
  const arr = [];
  for (let i = 0; i < size; i++) {
    arr.push(Math.floor(Math.random() * 1000));
  }
  return arr;
}

function renderQuestion() {
  const container = document.getElementById("question");
  if (!container) return;
  container.innerHTML = currentInput
    .map(num => `<div class="box">${num}</div>`)
    .join("");
}

function newQuestion() {
  currentInput = generateRandomArray();
  renderQuestion();
  const textarea = document.getElementById("codeInput");
  if (textarea) textarea.value = "";
  analysisResult = null;
  hintShown = false;
}

window.onload = () => {
  currentInput = generateRandomArray();
  renderQuestion();
};

const steps = [
  { id: 1, label: "Chào mừng", icon: "🤖" },
  { id: 2, label: "Thuật toán", icon: "⚡" },
  { id: 4, label: "Ngôn ngữ", icon: "🌐" },
  { id: 5, label: "Luyện tập", icon: "💻" },
];

const algoDescriptions = {
  "Bubble Sort": {
    desc: "So sánh các phần tử liền kề và hoán đổi nếu chúng ở sai thứ tự.",
    details: "• Độ phức tạp: O(n²)\n• Sắp xếp tại chỗ, ổn định\n• Phù hợp với tập dữ liệu nhỏ\n• Dễ hiểu và dễ triển khai"
  },
  "Selection Sort": {
    desc: "Tìm phần tử nhỏ nhất trong mảng chưa sắp xếp và đặt nó ở vị trí đúng.",
    details: "• Độ phức tạp: O(n²)\n• Sắp xếp tại chỗ, không ổn định\n• Giảm số lần hoán đổi\n• Tốc độ gần như không thay đổi với mọi dữ liệu"
  },
  "Insertion Sort": {
    desc: "Xây dựng mảng được sắp xếp bằng cách chèn từng phần tử vào đúng vị trí.",
    details: "• Độ phức tạp: O(n²), nhưng O(n) với dữ liệu gần đã sắp xếp\n• Sắp xếp tại chỗ, ổn định\n• Hiệu quả cho tập dữ liệu nhỏ\n• Được sử dụng trong nhiều thư viện tiêu chuẩn"
  },
  "Merge Sort": {
    desc: "Chia mảng thành các phần nhỏ, sắp xếp chúng, rồi gộp lại.",
    details: "• Độ phức tạp: O(n log n) trong mọi trường hợp\n• Sắp xếp ổn định\n• Yêu cầu thêm không gian: O(n)\n• Hiệu quả cho tập dữ liệu lớn"
  },
  "Quick Sort": {
    desc: "Chọn một phần tử làm pivot, phân chia mảng, và sắp xếp các phần.",
    details: "• Độ phức tạp: O(n log n) trung bình, O(n²) tồi nhất\n• Sắp xếp tại chỗ, không ổn định\n• Rất nhanh trên thực tế\n• Thường nhanh hơn Merge Sort do sửa dụng bộ nhớ tốt hơn"
  },
  "Heap Sort": {
    desc: "Xây dựng heap từ mảng và trích xuất phần tử lớn nhất/nhỏ nhất liên tục.",
    details: "• Độ phức tạp: O(n log n) trong mọi trường hợp\n• Sắp xếp tại chỗ, không ổn định\n• Không yêu cầu thêm không gian\n• Hiệu quả cho tập dữ liệu lớn"
  },
  "Radix Sort": {
    desc: "Sắp xếp theo từng chữ số, từ chữ số ít quan trọng nhất đến quan trọng nhất.",
    details: "• Độ phức tạp: O(d × (n + k)) với d là số chữ số\n• Phi so sánh, ổn định\n• Phù hợp với số nguyên\n• Rất nhanh cho dữ liệu có giới hạn giá trị"
  },
  "Shell Sort": {
    desc: "Cải tiến của Insertion Sort bằng cách sắp xếp các phần tử cách nhau một khoảng.",
    details: "• Độ phức tạp: O(n log n) đến O(n²) tùy gap\n• Sắp xếp tại chỗ, không ổn định\n• Nhanh hơn Insertion Sort cho mảng lớn\n• Gap sequence ảnh hưởng đến hiệu suất"
  }
};

const taskData = {
  "Bubble Sort": {
    hints: [
      "Bạn đã sắp xếp mảng chưa?",
      "Bạn cần dùng vòng lặp để duyệt mảng",
      "So sánh từng cặp phần tử liền kề",
      "Nếu phần tử trước lớn hơn phần tử sau thì đổi chỗ"
    ],
    fullSolution: "function bubbleSort(arr) {\n  let n = arr.length;\n  for(let i = 0; i < n-1; i++) {\n    for(let j = 0; j < n-i-1; j++) {\n      if(arr[j] > arr[j+1]) {\n        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];\n      }\n    }\n  }\n  return arr;\n}"
  },
  "Selection Sort": {
    hints: [
      "Bạn có tìm phần tử nhỏ nhất trong đoạn chưa sắp xếp không?",
      "Bạn cần dùng vòng lặp để tìm chỉ số minIdx",
      "Sau khi tìm minIdx, hãy hoán đổi với vị trí i",
      "Lặp lại mỗi lần i tăng lên, phần đầu mảng đã sắp xếp"
    ],
    fullSolution: "function selectionSort(arr) {\n  let n = arr.length;\n  for(let i = 0; i < n-1; i++) {\n    let minIdx = i;\n    for(let j = i+1; j < n; j++) {\n      if(arr[j] < arr[minIdx]) minIdx = j;\n    }\n    [arr[i], arr[minIdx]] = [arr[minIdx], arr[i]];\n  }\n  return arr;\n}"
  },
  "Insertion Sort": {
    hints: [
      "Bạn đã lưu phần tử hiện tại vào biến key chưa?",
      "Bạn cần dịch các phần tử lớn hơn key sang phải",
      "Sau khi dời, chèn key vào vị trí trống",
      "Lặp từ i=1 đến cuối để xây mảng sắp xếp"
    ],
    fullSolution: "function insertionSort(arr) {\n  for(let i = 1; i < arr.length; i++) {\n    let key = arr[i];\n    let j = i - 1;\n    while(j >= 0 && arr[j] > key) {\n      arr[j+1] = arr[j];\n      j--;\n    }\n    arr[j+1] = key;\n  }\n  return arr;\n}"
  },
  "Merge Sort": {
    hints: [
      "Mảng có độ dài 1 hoặc 0 đã sắp xếp rồi",
      "Chia mảng thành hai nửa trái và phải",
      "Gọi đệ quy mergeSort cho mỗi nửa",
      "Gộp hai mảng đã sắp vào bằng hàm merge"
    ],
    fullSolution: "function mergeSort(arr) {\n  if(arr.length <= 1) return arr;\n  let mid = Math.floor(arr.length / 2);\n  let left = mergeSort(arr.slice(0, mid));\n  let right = mergeSort(arr.slice(mid));\n  return merge(left, right);\n}\nfunction merge(l, r) {\n  let res = [];\n  while(l.length && r.length) res.push(l[0] < r[0] ? l.shift() : r.shift());\n  return res.concat(l, r);\n}"
  },
  "Quick Sort": {
    hints: [
      "Chọn một pivot (ví dụ phần tử ở giữa)",
      "Phân mảng thành left (<pivot), mid (=pivot), right (>pivot)",
      "Đệ quy quickSort cho left và right",
      "Gộp left + mid + right thành mảng đã sắp"
    ],
    fullSolution: "function quickSort(arr) {\n  if(arr.length <= 1) return arr;\n  let pivot = arr[Math.floor(arr.length/2)];\n  let left = arr.filter(x => x < pivot);\n  let mid = arr.filter(x => x === pivot);\n  let right = arr.filter(x => x > pivot);\n  return [...quickSort(left), ...mid, ...quickSort(right)];\n}"
  },
  "Heap Sort": {
    hints: [
      "Bạn cần xây dựng max-heap từ mảng",
      "Triển khai hàm heapify để duy trì tính chất heap",
      "Trích xuất phần tử lớn nhất và giảm kích thước heap",
      "Lặp lại cho đến khi heap rỗng"
    ],
    fullSolution: "function heapSort(arr) {\n  let n = arr.length;\n  for(let i = Math.floor(n/2)-1; i >= 0; i--) heapify(arr, n, i);\n  for(let i = n-1; i > 0; i--) {\n    [arr[0], arr[i]] = [arr[i], arr[0]];\n    heapify(arr, i, 0);\n  }\n  return arr;\n}\nfunction heapify(arr, n, i) {\n  let largest = i, left = 2*i+1, right = 2*i+2;\n  if(left < n && arr[left] > arr[largest]) largest = left;\n  if(right < n && arr[right] > arr[largest]) largest = right;\n  if(largest !== i) {\n    [arr[i], arr[largest]] = [arr[largest], arr[i]];\n    heapify(arr, n, largest);\n  }\n}"
  },
  "Radix Sort": {
    hints: [
      "Bạn cần tìm số lớn nhất để xác định số chữ số",
      "Sắp xếp theo từng chữ số (units, tens, hundreds...)",
      "Sử dụng counting sort cho mỗi chữ số",
      "Lặp lại cho đến khi xử lý hết tất cả chữ số"
    ],
    fullSolution: "function radixSort(arr) {\n  let max = Math.max(...arr);\n  for(let exp = 1; Math.floor(max/exp) > 0; exp *= 10) {\n    countingSort(arr, exp);\n  }\n  return arr;\n}\nfunction countingSort(arr, exp) {\n  let output = [], count = Array(10).fill(0);\n  for(let i = 0; i < arr.length; i++) count[Math.floor(arr[i]/exp)%10]++;\n  for(let i = 1; i < 10; i++) count[i] += count[i-1];\n  for(let i = arr.length-1; i >= 0; i--) {\n    output[count[Math.floor(arr[i]/exp)%10]-1] = arr[i];\n    count[Math.floor(arr[i]/exp)%10]--;\n  }\n  for(let i = 0; i < arr.length; i++) arr[i] = output[i];\n}"
  },
  "Shell Sort": {
    hints: [
      "Bạn cần chọn gap sequence (ví dụ: n/2, n/4, ...)",
      "Sắp xếp các phần tử cách nhau gap",
      "Giảm gap và lặp lại cho đến khi gap = 1",
      "Khi gap = 1, nó giống insertion sort nhưng mảng đã gần sắp xếp"
    ],
    fullSolution: "function shellSort(arr) {\n  let n = arr.length;\n  for(let gap = Math.floor(n/2); gap > 0; gap = Math.floor(gap/2)) {\n    for(let i = gap; i < n; i++) {\n      let temp = arr[i];\n      let j;\n      for(j = i; j >= gap && arr[j-gap] > temp; j -= gap) {\n        arr[j] = arr[j-gap];\n      }\n      arr[j] = temp;\n    }\n  }\n  return arr;\n}"
  }
};

const viewContainer = document.getElementById("viewContainer");
const modalContainer = document.getElementById("modalContainer");
const sidebarNav = document.getElementById("sidebarNav");
const pathText = document.getElementById("pathText");
const backBtn = document.getElementById("backBtn");

backBtn.onclick = () => {
  if (step === 3) step = 2;
  else if (step > 1) step--;
  render();
};

function setStep(n) {
  step = n;
  render();
}

function renderSidebar() {
  sidebarNav.innerHTML = "";
  steps.forEach(s => {
    const locked = s.id > step && !(step === 3 && s.id === 2);
    const active = step === s.id || (step === 3 && s.id === 2);

    const div = document.createElement("div");
    div.className = `nav-item ${active ? "active" : ""} ${locked ? "locked" : ""}`;
    div.innerHTML = `
      <span class="icon">${s.icon}</span>
      <span class="label">${s.label}</span>
      ${locked ? `<span class="lock-icon">🔒</span>` : ""}
    `;
    // add data-label for CSS tooltip display
    div.dataset.label = s.label;
    if (!locked) div.onclick = () => setStep(s.id);
    sidebarNav.appendChild(div);
  });
}

function renderView() {
  pathText.textContent = `Hệ thống / Bước ${step}`;
  backBtn.style.display = step > 1 ? "inline" : "none";

  if (step === 1) {
    viewContainer.innerHTML = `
      <div class="welcome-view fade-in">
        <h1 class="glow-text">AI MÔ PHỎNG</h1>
        <p class="description">Hệ thống huấn luyện tư duy thuật toán chuyên sâu.</p>
        <button class="btn-primary" onclick="setStep(2)">Bắt đầu</button>
      </div>
    `;
  }

  if (step === 2) {
    const algos = ["Bubble Sort","Selection Sort","Insertion Sort","Merge Sort","Quick Sort","Heap Sort","Radix Sort","Shell Sort"];
    viewContainer.innerHTML = `
      <div class="view-inner fade-in">
        <h2 class="title">Chọn thuật toán</h2>
        <div class="clean-grid">
          ${algos.map(a =>
            `<div class="interactive-box" onclick="selectAlgo('${a}')">${a}</div>`
          ).join("")}
        </div>
      </div>
    `;
  }

  if (step === 3) {
    const algo = algoDescriptions[selectedAlgo];
    viewContainer.innerHTML = `
      <div class="view-inner fade-in center">
        <h2 class="glow-text">${selectedAlgo}</h2>
        <div class="description-card">
          <p class="main-desc">${algo.desc}</p>
          <pre class="algo-details">${algo.details}</pre>
        </div>
        <button class="btn-primary" onclick="setStep(4)">Tiếp tục</button>
      </div>
    `;
  }

  if (step === 4) {
    const langs = ["JavaScript","C++","Python","Java","C#","Go","Rust","PHP","Ruby","Swift","Kotlin","TypeScript"];
    viewContainer.innerHTML = `
      <div class="view-inner fade-in">
        <h2 class="title">Chọn ngôn ngữ</h2>
        <div class="clean-grid">
          ${langs.map(l =>
            `<div class="interactive-box" onclick="selectLang('${l}')">${l}</div>`
          ).join("")}
        </div>
      </div>
    `;
  }

  if (step === 5) {
    viewContainer.innerHTML = `
      <div class="workspace fade-in">
        <div class="editor-side">
          <div class="editor-top">
            <span>Trình soạn thảo ${selectedLang}</span>
          </div>
          <textarea id="codeInput" spellcheck="false" placeholder="Nhập mã nguồn..."></textarea>
          <div class="submit-row">
            <button id="submitBtn" class="btn-primary">Chấm bài</button>
          </div>
        </div>

        <div class="info-side">
          <h3>Bài tập ${selectedAlgo}</h3>
          <button class="btn-reload btn-reload-fixed" onclick="newQuestion()" title="Tạo đề mới">↻</button>
          <p style="color:#b3f0e6; margin-bottom:10px;">Đề bài</p>
          <div id="question" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px;"></div>
          <!-- Gợi ý từ AI -->
          <div id="aiHintsContainer" style="margin-top: 20px; display: none;"></div>
        </div>
      </div>
    `;

    renderQuestion();

    // Set textarea value
    const textarea = document.getElementById("codeInput");
    if (textarea) textarea.value = userCode;

    if (analysisResult) {
      const { isCorrect, result, hints, explanation } = analysisResult;
      const pass = isCorrect === true || result === "Đúng";
      
      if (pass) {
        modalContainer.innerHTML = `
          <div class="modal-overlay"></div>
          <div class="analysis-result correct fade-in">
            <div class="result-icon">✓</div>
            <div class="result-title">Tuyệt vời!</div>
            <div class="result-message">Code của bạn chạy hoàn toàn chính xác!</div>
            ${explanation ? `<div class="result-explanation">${explanation}</div>` : ''}
            <div class="btn-group">
              <button class="btn-primary" onclick="retryExercise()">Luyện tập lại</button>
              <button class="btn-primary" onclick="selectNewAlgo()">Chọn thuật toán</button>
              <button class="btn-primary" onclick="goHome()">Trang chủ</button>
            </div>
          </div>
        `;
        const hintsContainer = document.getElementById("aiHintsContainer");
        if (hintsContainer) hintsContainer.style.display = "none";
      } else {
        // Sai => Hiện gợi ý inline
        modalContainer.innerHTML = "";
        
        const hintsContainer = document.getElementById("aiHintsContainer");
        if (hintsContainer) {
          hintsContainer.style.display = "block";
          
          let hintsHTML = "";
          if (hints && Array.isArray(hints)) {
             hintsHTML = hints.map((h, i) => `
               <div class="hint-box hint-level-${i + 1}">
                 <strong>Gợi ý ${i + 1}:</strong> ${h}
               </div>`).join("");
          } else if (hints) {
             hintsHTML = `
               <div class="hint-box hint-level-1">
                 ${hints}
               </div>`;
          } else {
             hintsHTML = `
               <div class="hint-box hint-level-3">
                 Code chưa chính xác. Cố gắng tìm lỗi logic nhé!
               </div>`;
          }

          hintsContainer.innerHTML = `
            <div class="fade-in">
              <h4 style="color:#ffb86c; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; font-size: 1.1em;">
                <span>💡</span> Hệ thống nhắc nhở
              </h4>
              ${hintsHTML}
            </div>
          `;
        }
      }
    } else {
      modalContainer.innerHTML = "";
    }
  }
}

function selectAlgo(a) {
  selectedAlgo = a;
  step = 3;
  render();
}

function selectLang(l) {
  selectedLang = l;
  step = 5;
  hintLevel = 0;
  hintShown = false;
  analysisResult = null;
  userCode = "";
  currentInput = generateRandomArray();
  render();
}

function analyzeCode() {
  const textarea = document.getElementById("codeInput");
  if (textarea) userCode = textarea.value;
  hintShown = true;
  if (hintLevel === 0) hintLevel = 1;
  render();
}

async function submitCode() {
  const textarea = document.getElementById("codeInput");
  const userCodeText = textarea ? textarea.value.trim() : "";

  if (!userCodeText) {
    alert("Vui lòng nhập mã nguồn trước khi chấm bài!");
    return;
  }

  userCode = userCodeText;

  const btn = document.getElementById("submitBtn");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Đang chấm...";
  }

  const inputCopy = [...currentInput];
  const expectedOutput = [...inputCopy].sort((a, b) => a - b);

  try {
    const res = await fetch("https://be-datn-6gb6.onrender.com/api/aicoach/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        code: userCode,
        input: inputCopy,
        expected: expectedOutput,
        language: selectedLang,
        algorithm: selectedAlgo
      })
    });

    const data = await res.json();
    console.log("[AI RESPONSE]:", data);

    if (data && data.isCorrect === false && data.annotatedCode) {
        userCode = data.annotatedCode;
    }

    analysisResult = data;
    render();

  } catch (err) {
    console.error(err);
    analysisResult = {
      isCorrect: false,
      result: "Lỗi",
      hints: ["Không kết nối được server. Bạn đã chạy server.js chưa?"]
    };
    render();
  }
}

function retryExercise() {
  // Làm lại bài tập với dữ liệu ngẫu nhiên khác
  hintLevel = 0;
  hintShown = false;
  analysisResult = null;
  userCode = "";
  currentInput = generateRandomArray();
  render();
}

function selectNewAlgo() {
  // Quay lại chọn thuật toán
  step = 2;
  selectedAlgo = "";
  selectedLang = "";
  hintLevel = 0;
  hintShown = false;
  analysisResult = null;
  userCode = "";
  render();
}

function goHome() {
  step = 1;
  selectedAlgo = "";
  selectedLang = "";
  hintLevel = 0;
  hintShown = false;
  analysisResult = null;
  userCode = "";
  render();
}

function render() {
  renderSidebar();
  // Clear modal container before rendering view so leftover modals are removed
  if (typeof modalContainer !== 'undefined' && modalContainer) modalContainer.innerHTML = "";
  renderView();

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.onclick = submitCode;

  // Không re-render modal nếu chỉ cần update state
}

render();

// Exit handler: try to close window, fallback to about:blank
function exitApp() {
  try {
    // attempt to close the window (works if opened by script)
    window.close();
  } catch (e) {
    // ignore
  }
  // fallback: navigate away
  try {
    window.location.href = 'about:blank';
  } catch (e) {}
}

// Attach listeners for exit button and Esc key
document.addEventListener('keydown', (ev) => {
  if (ev.key === 'Escape') exitApp();
});

const _exitBtn = document.getElementById('exitBtn');
if (_exitBtn) _exitBtn.addEventListener('click', exitApp);

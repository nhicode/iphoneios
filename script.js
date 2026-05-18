let dictionary = [];
let searchDebounceTimer; // Timer để tự động tìm

// Sử dụng proxy để chống lỗi chặn CORS và link Github chứa từ điển chuẩn
const dictionaryUrl = "https://api.allorigins.win/raw?url=https://raw.githubusercontent.com/winstonleedev/tudien/master/tudien.txt";

const inputField = document.getElementById("opponent-word");
const resultsList = document.getElementById("results-list");
const resultStatus = document.getElementById("result-status");
const resultCountText = document.getElementById("result-count");
const startOverlay = document.getElementById("start-overlay");

// Tự động tải từ điển
fetchDictionary();

// Lắng nghe sự kiện để tự động dán văn bản và ẩn overlay
document.addEventListener('click', handleFirstInteraction);
inputField.addEventListener('input', handleAutoSearch);

// Tải dữ liệu từ điển
async function fetchDictionary() {
    resultStatus.textContent = "Đang tải dữ liệu...";
    resultsList.innerHTML = '<li class="empty-msg">Vui lòng đợi trong giây lát...</li>';
    
    try {
        const response = await fetch(dictionaryUrl);
        if (!response.ok) throw new Error("Không thể kết nối đến URL");
        
        const textData = await response.text();
        
        // Tách dòng, đổi dấu gạch dưới (nếu có) thành dấu cách, và LỌC lấy từ có đúng 2 tiếng
        dictionary = textData.split("\n")
            .map(word => word.trim().toLowerCase().replace(/_/g, " "))
            .filter(word => word.split(/\s+/).length === 2);
            
        resultStatus.textContent = `Kho dữ liệu: ${dictionary.length} từ`;
        resultStatus.classList.add('loaded');
        resultsList.innerHTML = '<li class="empty-msg">Tải hoàn tất! Sẵn sàng nhập từ.</li>';
    } catch (error) {
        resultStatus.textContent = "Lỗi dữ liệu!";
        resultStatus.classList.add('error');
        resultsList.innerHTML = `<li class="empty-msg" style="color: #ff5252;">Lỗi: ${error.message}</li>`;
    }
}

// Xử lý lần tương tác đầu tiên: ấn overlay, thử paste tự động
function handleFirstInteraction() {
    // Ẩn overlay
    startOverlay.classList.add('hidden');
    // Loại bỏ listener để không lặp lại
    document.removeEventListener('click', handleFirstInteraction);
    
    // Thử đọc từ clipboard và dán
    tryToPaste();
}

// Tự động tìm kiếm khi dữ liệu nhập thay đổi
function handleAutoSearch() {
    // Xóa timer cũ nếu có
    clearTimeout(searchDebounceTimer);
    // Tạo timer mới với độ trễ nhỏ để tránh tìm quá nhiều
    searchDebounceTimer = setTimeout(findNextWords, 300);
}

// Hàm thử đọc từ clipboard và dán
async function tryToPaste() {
    try {
        if (!navigator.clipboard) throw new Error("Clipboard API không khả dụng");
        
        const text = await navigator.clipboard.readText();
        if (text && text.trim()) {
            inputField.value = text.trim();
            // Tự động kích hoạt tìm kiếm
            handleAutoSearch();
        }
    } catch (error) {
        console.warn("Không thể dán tự động:", error.message);
        // Có thể hiện một thông báo nhẹ nhàng nếu muốn
    }
}

// Hàm logic tìm từ
function findNextWords() {
    if (dictionary.length === 0) {
        // Có thể thêm hiệu ứng cảnh báo nếu muốn
        return;
    }

    const word = inputField.value.trim().toLowerCase();
    
    if (!word) {
        resultCountText.textContent = "0 từ gợi ý";
        resultsList.innerHTML = '<li class="empty-msg">Chưa có dữ liệu.</li>';
        return;
    }

    const parts = word.split(/\s+/);
    const lastSyllable = parts[parts.length - 1];

    const prefix = lastSyllable + " ";
    
    const matchedWords = dictionary.filter(dictWord => {
        return dictWord.startsWith(prefix);
    });

    displayResults(matchedWords);
}

// Hiển thị kết quả mượt mà
function displayResults(wordsArray) {
    resultsList.innerHTML = ""; // Xóa kết quả cũ
    resultCountText.textContent = `${wordsArray.length} từ gợi ý`;

    if (wordsArray.length === 0) {
        resultsList.innerHTML = '<li class="empty-msg">Không tìm thấy từ nào để nối.</li>';
        return;
    }

    wordsArray.forEach((word, index) => {
        const li = document.createElement("li");
        li.textContent = word;
        
        // Thêm độ trễ animation tăng dần cho từng mục
        li.style.animationDelay = `${index * 0.05}s`;
        
        // Nhấp vào để Copy mượt mà
        li.addEventListener("click", () => {
            navigator.clipboard.writeText(word);
            
            // Hiệu ứng copy
            const originalText = li.textContent;
            li.textContent = "Đã copy ✔️";
            li.classList.add('copying');
            
            setTimeout(() => {
                li.textContent = originalText;
                li.classList.remove('copying');
            }, 800);
        });

        resultsList.appendChild(li);
    });
}

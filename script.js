// 1. Khởi tạo mảng trống và URL chứa file text từ điển
let dictionary = [];
const dictionaryUrl = "https://raw.githubusercontent.com/vntk/dictionary/master/words.txt";

// 2. Lấy các phần tử DOM
const inputField = document.getElementById("opponent-word");
const searchBtn = document.getElementById("search-btn");
const resultsList = document.getElementById("results-list");
const resultCount = document.getElementById("result-count");

// 3. Hàm fetch dữ liệu từ điển từ URL
async function fetchDictionary() {
    resultCount.textContent = "Đang tải dữ liệu...";
    resultsList.innerHTML = '<li class="empty-msg">Vui lòng đợi trong giây lát...</li>';
    
    try {
        const response = await fetch(dictionaryUrl);
        if (!response.ok) throw new Error("Không thể kết nối đến URL");
        
        const textData = await response.text();
        
        // Tách văn bản thành các dòng, bỏ khoảng trắng thừa và LỌC LẤY TỪ CÓ 2 TIẾNG
        dictionary = textData.split("\n")
            .map(word => word.trim().toLowerCase())
            .filter(word => word.split(/\s+/).length === 2);
            
        resultCount.textContent = `Kho dữ liệu: ${dictionary.length} từ`;
        resultsList.innerHTML = '<li class="empty-msg">Tải hoàn tất! Sẵn sàng nhập từ.</li>';
    } catch (error) {
        resultCount.textContent = "Lỗi dữ liệu!";
        resultsList.innerHTML = `<li class="empty-msg" style="color: #ff5252;">Lỗi: ${error.message}</li>`;
    }
}

// Gọi hàm tải dữ liệu ngay khi khởi chạy
fetchDictionary();

// 4. Lắng nghe sự kiện
searchBtn.addEventListener("click", findNextWords);
inputField.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        findNextWords();
    }
});

// 5. Hàm xử lý logic tìm từ
function findNextWords() {
    if (dictionary.length === 0) {
        alert("Kho dữ liệu chưa tải xong hoặc bị lỗi, vui lòng đợi!");
        return;
    }

    const word = inputField.value.trim().toLowerCase();
    
    if (!word) {
        alert("Vui lòng nhập từ của đối thủ!");
        return;
    }

    // Tách lấy tiếng cuối cùng của đối thủ
    const parts = word.split(/\s+/);
    const lastSyllable = parts[parts.length - 1];

    // Quét trong từ điển những từ bắt đầu bằng tiếng cuối cùng + khoảng trắng
    const prefix = lastSyllable + " ";
    
    const matchedWords = dictionary.filter(dictWord => {
        return dictWord.startsWith(prefix);
    });

    displayResults(matchedWords);
}

// 6. Hiển thị kết quả ra màn hình
function displayResults(wordsArray) {
    resultsList.innerHTML = ""; 
    resultCount.textContent = `Tìm thấy: ${wordsArray.length} từ`;

    if (wordsArray.length === 0) {
        resultsList.innerHTML = '<li class="empty-msg">Không tìm thấy từ nào để nối.</li>';
        return;
    }

    wordsArray.forEach(word => {
        const li = document.createElement("li");
        li.textContent = word;
        
        // Chạm vào để Copy mượt mà, không dùng alert
        li.addEventListener("click", () => {
            navigator.clipboard.writeText(word);
            
            // Hiệu ứng phản hồi UI
            const originalText = li.textContent;
            li.textContent = "Đã copy ✔️";
            li.style.color = "#fff";
            li.style.backgroundColor = "#4CAF50";
            li.style.borderRadius = "4px";
            
            setTimeout(() => {
                li.textContent = originalText;
                li.style.color = "#4CAF50";
                li.style.backgroundColor = "transparent";
            }, 800);
        });

        resultsList.appendChild(li);
    });
}

(function() {
    // ========== URL từ điển nhanh (jsDelivr CDN) ==========
    const dictionaryUrl = "https://cdn.jsdelivr.net/gh/winstonleedev/tudien/tudien.txt";
    let dictionary = [];

    // DOM elements
    const inputField = document.getElementById("opponent-word");
    const searchBtn = document.getElementById("search-btn");
    const pasteBtn = document.getElementById("paste-btn");
    const resultsList = document.getElementById("results-list");
    const resultCount = document.getElementById("result-count");
    const container = document.getElementById("main-container");

    // ========== Tối ưu render với DocumentFragment ==========
    function renderResults(wordsArray) {
        // Xóa nội dung cũ
        resultsList.innerHTML = "";
        resultCount.textContent = `🔍 ${wordsArray.length} từ`;

        if (wordsArray.length === 0) {
            const li = document.createElement("li");
            li.className = "empty-msg";
            li.textContent = "😔 Không tìm thấy từ nào để nối.";
            resultsList.appendChild(li);
            return;
        }

        const fragment = document.createDocumentFragment();
        wordsArray.forEach((word, index) => {
            const li = document.createElement("li");
            li.textContent = word;
            // Xuất hiện tuần tự mượt
            li.style.opacity = '0';
            li.style.transform = 'translateX(15px)';
            li.style.transition = `opacity 0.25s ease, transform 0.25s ease`;
            li.style.transitionDelay = `${index * 0.02}s`;

            // Click để copy
            li.addEventListener("click", function(e) {
                e.stopPropagation();
                handleCopy(word, this);
            });

            fragment.appendChild(li);
        });

        resultsList.appendChild(fragment);

        // Kích hoạt animation sau khi đã thêm vào DOM
        requestAnimationFrame(() => {
            const items = resultsList.querySelectorAll('li:not(.empty-msg)');
            items.forEach(li => {
                li.style.opacity = '1';
                li.style.transform = 'translateX(0)';
            });
        });
    }

    // ========== Copy từ với fallback ==========
    function handleCopy(word, element) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(word).then(() => {
                showCopyFeedback(element);
            }).catch(() => {
                fallbackCopy(word, element);
            });
        } else {
            fallbackCopy(word, element);
        }
    }

    function fallbackCopy(word, element) {
        const textarea = document.createElement('textarea');
        textarea.value = word;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(textarea);
        showCopyFeedback(element);
    }

    function showCopyFeedback(element) {
        const originalText = element.textContent;
        element.textContent = "✅ Đã copy!";
        element.classList.add("copied-flash");
        setTimeout(() => {
            element.textContent = originalText;
            element.classList.remove("copied-flash");
        }, 900);
    }

    // ========== Ripple effect (tối ưu) ==========
    function createRipple(e, el) {
        const ripple = document.createElement("span");
        ripple.className = "ripple-effect";
        const rect = el.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size/2}px`;
        ripple.style.top = `${e.clientY - rect.top - size/2}px`;
        el.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    // Gắn ripple cho các nút
    [searchBtn, pasteBtn].forEach(btn => {
        btn.addEventListener('click', (e) => createRipple(e, btn));
    });

    // ========== Tải từ điển nhanh ==========
    async function fetchDictionary() {
        resultCount.textContent = "Đang tải...";
        resultsList.innerHTML = '<li class="empty-msg">🔄 Đang tải dữ liệu...</li>';
        try {
            const response = await fetch(dictionaryUrl);
            if (!response.ok) throw new Error("Lỗi kết nối");
            const text = await response.text();
            dictionary = text.split("\n")
                .map(w => w.trim().toLowerCase().replace(/_/g, " "))
                .filter(w => w.split(/\s+/).length === 2);
            resultCount.textContent = `📚 ${dictionary.length} từ`;
            resultsList.innerHTML = '<li class="empty-msg">✅ Sẵn sàng! Nhập từ để tìm.</li>';
        } catch (err) {
            resultCount.textContent = "⚠️ Lỗi";
            resultsList.innerHTML = `<li class="empty-msg" style="color:#ff6b6b;">⚠️ ${err.message}</li>`;
        }
    }

    // ========== Tìm từ nối ==========
    function findNextWords() {
        if (!dictionary.length) {
            alert("⏳ Dữ liệu chưa sẵn sàng!");
            return;
        }
        const word = inputField.value.trim().toLowerCase();
        if (!word) {
            inputField.style.animation = 'shake 0.4s';
            setTimeout(() => inputField.style.animation = '', 400);
            return;
        }
        const lastSyllable = word.split(/\s+/).pop();
        const prefix = lastSyllable + " ";
        const matches = dictionary.filter(w => w.startsWith(prefix));
        renderResults(matches);
    }

    // ========== Auto paste & search ==========
    async function autoPasteAndSearch() {
        if (!dictionary.length) {
            alert("⏳ Đợi dữ liệu tải xong nhé!");
            return;
        }
        try {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
                inputField.value = text.trim();
                findNextWords();
            } else {
                alert("📋 Clipboard trống!");
            }
        } catch (e) {
            alert("🔒 Không đọc được clipboard. Vui lòng dán thủ công (Ctrl+V).");
            inputField.focus();
        }
    }

    // ========== Events ==========
    searchBtn.addEventListener('click', findNextWords);
    pasteBtn.addEventListener('click', autoPasteAndSearch);

    inputField.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') findNextWords();
    });

    // Phím tắt Ctrl+Shift+V để auto dán & tìm
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'V') {
            e.preventDefault();
            autoPasteAndSearch();
        }
    });

    // Khởi động
    fetchDictionary();
    setTimeout(() => inputField.focus(), 400);
})();

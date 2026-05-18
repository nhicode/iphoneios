(function() {
    // URL từ điển Viet74K qua CDN jsDelivr
    const DICT_URL = "https://cdn.jsdelivr.net/gh/duyet/vietnamese-wordlist@master/Viet74K.txt";
    let dictionary = [];
    let isReady = false;

    const input = document.getElementById("wordInput");
    const clearBtn = document.getElementById("clearBtn");
    const resultCount = document.getElementById("resultCount");
    const resultsList = document.getElementById("resultsList");
    const container = document.getElementById("appContainer");

    // ========== Tải từ điển ==========
    async function loadDictionary() {
        resultCount.textContent = "⏳ Đang tải...";
        resultsList.innerHTML = '<li class="empty-msg">🔄 Đang tải dữ liệu...</li>';
        try {
            const resp = await fetch(DICT_URL);
            if (!resp.ok) throw new Error("Lỗi mạng");
            const text = await resp.text();
            
            // Tách từ theo dòng, chuyển về chữ thường, bỏ ký tự đặc biệt nếu cần
            dictionary = text.split("\n")
                .map(w => w.trim().toLowerCase())
                .filter(w => w.length > 0);
            
            isReady = true;
            resultCount.textContent = `📚 ${dictionary.length.toLocaleString()} từ`;
            resultsList.innerHTML = '<li class="empty-msg">✅ Sẵn sàng – Chạm màn hình để dán từ</li>';
        } catch (e) {
            resultCount.textContent = "⚠️ Lỗi";
            resultsList.innerHTML = `<li class="empty-msg" style="color:#ff6b6b;">⚠️ ${e.message}</li>`;
        }
    }

    // ========== Tìm từ nối (chỉ lấy từ có 2 tiếng) ==========
    function findAndDisplay() {
        if (!isReady) return;
        const raw = input.value.trim().toLowerCase();
        if (!raw) {
            resultCount.textContent = "0 từ";
            resultsList.innerHTML = '<li class="empty-msg">🔍 Nhập từ hoặc chạm để dán</li>';
            return;
        }

        const lastWord = raw.split(/\s+/).pop();
        
        // Lọc: bắt đầu bằng lastWord VÀ có đúng 2 tiếng (tức có 1 khoảng trắng)
        let matches = dictionary.filter(w => {
            return w.startsWith(lastWord) && w.split(/\s+/).length === 2;
        });

        // Giới hạn hiển thị 200 từ để tránh lag
        const displayWords = matches.slice(0, 200);
        const fragment = document.createDocumentFragment();
        resultCount.textContent = `🔍 ${matches.length.toLocaleString()} từ (2 tiếng)`;

        if (displayWords.length === 0) {
            const li = document.createElement("li");
            li.className = "empty-msg";
            li.textContent = "😔 Không tìm thấy từ 2 tiếng nào";
            fragment.appendChild(li);
        } else {
            displayWords.forEach((word, idx) => {
                const li = document.createElement("li");
                li.textContent = word;
                li.style.opacity = '0';
                li.style.transform = 'translateY(10px)';
                li.style.transition = `all 0.25s ease ${idx * 0.02}s`;
                li.addEventListener("click", (e) => {
                    e.stopPropagation();
                    copyWord(word, li);
                });
                fragment.appendChild(li);
            });
        }

        resultsList.innerHTML = "";
        resultsList.appendChild(fragment);

        requestAnimationFrame(() => {
            resultsList.querySelectorAll("li:not(.empty-msg)").forEach(li => {
                li.style.opacity = '1';
                li.style.transform = 'translateY(0)';
            });
        });
    }

    // Debounce khi gõ tay
    let debounceTimer;
    function onInput() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(findAndDisplay, 300);
    }

    // ========== Copy từ ==========
    async function copyWord(word, element) {
        try {
            await navigator.clipboard.writeText(word);
        } catch {
            const ta = document.createElement("textarea");
            ta.value = word;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        const original = element.textContent;
        element.textContent = "✅ Đã copy!";
        element.classList.add("copied-flash");
        setTimeout(() => {
            element.textContent = original;
            element.classList.remove("copied-flash");
        }, 900);
    }

    // ========== Tự động dán clipboard ==========
    async function attemptAutoPaste() {
        if (!isReady) return;
        if (input.value.trim()) return;

        try {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
                input.value = text.trim();
                updateClearButton();
                findAndDisplay();
            } else {
                input.placeholder = "Nhập từ của đối thủ...";
            }
        } catch (err) {
            input.placeholder = "Dán thủ công (Ctrl+V) hoặc gõ từ...";
            console.log("Auto‑paste cần user gesture:", err.message);
        }
    }

    // ========== Xoá từ ==========
    function clearInput() {
        input.value = "";
        updateClearButton();
        findAndDisplay(); // reset kết quả
        input.focus();
    }

    function updateClearButton() {
        if (input.value.trim().length > 0) {
            clearBtn.classList.add("visible");
        } else {
            clearBtn.classList.remove("visible");
        }
    }

    // ========== Ripple chất lỏng ==========
    function createRipple(e) {
        const ripple = document.createElement("span");
        ripple.className = "ripple";
        const rect = container.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${e.clientX - rect.left - size/2}px`;
        ripple.style.top = `${e.clientY - rect.top - size/2}px`;
        container.appendChild(ripple);
        ripple.addEventListener('animationend', () => ripple.remove());
    }

    // ========== Sự kiện ==========
    document.addEventListener('click', function(e) {
        if (isReady && !input.value.trim()) {
            attemptAutoPaste();
        }
        if (container.contains(e.target)) {
            createRipple(e);
        }
    });

    input.addEventListener('focus', () => {
        if (isReady && !input.value.trim()) {
            attemptAutoPaste();
        }
    });

    input.addEventListener('paste', () => {
        setTimeout(() => {
            updateClearButton();
            findAndDisplay();
        }, 10);
    });

    input.addEventListener('input', () => {
        updateClearButton();
        onInput();
    });

    clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        clearInput();
    });

    // Khởi động
    loadDictionary();
    updateClearButton();
})();

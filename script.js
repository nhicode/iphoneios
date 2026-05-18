(function() {
    // URL từ điển siêu nhanh (CDN)
    const DICT_URL = "https://cdn.jsdelivr.net/gh/winstonleedev/tudien/tudien.txt";
    let dictionary = [];
    let isReady = false;
    let autoPasteDone = false; // chỉ tự động dán 1 lần

    // DOM
    const input = document.getElementById("wordInput");
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
            dictionary = text.split("\n")
                .map(w => w.trim().toLowerCase().replace(/_/g, " "))
                .filter(w => w.split(/\s+/).length === 2);
            isReady = true;
            resultCount.textContent = `📚 ${dictionary.length} từ`;
            resultsList.innerHTML = '<li class="empty-msg">✅ Sẵn sàng – Chạm màn hình để dán từ</li>';
        } catch (e) {
            resultCount.textContent = "⚠️ Lỗi";
            resultsList.innerHTML = `<li class="empty-msg" style="color:#ff6b6b;">⚠️ ${e.message}</li>`;
        }
    }

    // ========== Tìm từ nối ==========
    function findAndDisplay() {
        if (!isReady) return;
        const raw = input.value.trim().toLowerCase();
        if (!raw) {
            resultCount.textContent = "0 từ";
            resultsList.innerHTML = '<li class="empty-msg">🔍 Nhập từ hoặc chạm để dán</li>';
            return;
        }

        const lastWord = raw.split(/\s+/).pop();
        const prefix = lastWord + " ";
        const matches = dictionary.filter(w => w.startsWith(prefix));

        const fragment = document.createDocumentFragment();
        resultCount.textContent = `🔍 ${matches.length} từ`;
        if (matches.length === 0) {
            const li = document.createElement("li");
            li.className = "empty-msg";
            li.textContent = "😔 Không tìm thấy từ nối";
            fragment.appendChild(li);
        } else {
            matches.forEach((word, idx) => {
                const li = document.createElement("li");
                li.textContent = word;
                li.style.opacity = '0';
                li.style.transform = 'translateY(10px)';
                li.style.transition = `all 0.25s ease ${idx * 0.025}s`;
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
        debounceTimer = setTimeout(findAndDisplay, 350);
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

    // ========== Tự động dán clipboard (cần user gesture) ==========
    async function attemptAutoPaste() {
        if (!isReady) return;
        if (autoPasteDone && input.value.trim()) return; // đã dán rồi, không làm lại nếu có từ
        try {
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
                input.value = text.trim();
                autoPasteDone = true;
                findAndDisplay();
            } else {
                // Nếu clipboard trống, chỉ đặt placeholder
                input.placeholder = "Nhập từ của đối thủ...";
            }
        } catch (err) {
            // Không có quyền hoặc lỗi – hiển thị hướng dẫn
            console.log("Auto-paste cần quyền:", err.message);
            input.placeholder = "Dán thủ công (Ctrl+V) hoặc gõ từ...";
        }
    }

    // ========== Ripple effect khi chạm vào container ==========
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
    // Lắng nghe click toàn bộ document để kích hoạt auto-paste
    document.addEventListener('click', function firstClickHandler(e) {
        // Chỉ gọi auto-paste nếu chưa có từ và sẵn sàng
        if (isReady && !input.value.trim()) {
            attemptAutoPaste();
        }
        // Tạo ripple nếu click trong container
        if (container.contains(e.target)) {
            createRipple(e);
        }
        // Không xoá handler vì ta vẫn muốn tự động dán khi input trống (có thể xoá sau)
        // Nhưng để tránh gọi liên tục, kiểm tra input trống.
    });

    // Khi focus vào input (do click), cũng thử auto-paste nếu trống
    input.addEventListener('focus', () => {
        if (isReady && !input.value.trim()) {
            attemptAutoPaste();
        }
    });

    // Khi paste thủ công
    input.addEventListener('paste', () => {
        setTimeout(findAndDisplay, 10);
    });

    // Khi gõ
    input.addEventListener('input', onInput);

    // Khởi động
    loadDictionary();
})();

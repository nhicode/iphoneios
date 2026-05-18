(function() {
    // URL từ điển siêu nhanh (CDN)
    const DICT_URL = "https://cdn.jsdelivr.net/gh/winstonleedev/tudien/tudien.txt";
    let dictionary = [];
    let isDictionaryReady = false;

    // DOM
    const input = document.getElementById("wordInput");
    const resultCount = document.getElementById("resultCount");
    const resultsList = document.getElementById("resultsList");

    // ========== Tải từ điển ==========
    async function fetchDictionary() {
        resultCount.textContent = "⏳ Đang tải...";
        resultsList.innerHTML = '<li class="empty-msg">🔄 Đang tải dữ liệu...</li>';
        try {
            const resp = await fetch(DICT_URL);
            if (!resp.ok) throw new Error("Lỗi mạng");
            const text = await resp.text();
            dictionary = text.split("\n")
                .map(w => w.trim().toLowerCase().replace(/_/g, " "))
                .filter(w => w.split(/\s+/).length === 2);
            isDictionaryReady = true;
            resultCount.textContent = `📚 ${dictionary.length} từ`;
            resultsList.innerHTML = '<li class="empty-msg">✅ Sẵn sàng – nhập hoặc dán từ.</li>';
            
            // Sau khi tải xong, thử auto‑paste từ clipboard
            attemptAutoPaste();
        } catch (e) {
            resultCount.textContent = "⚠️ Lỗi";
            resultsList.innerHTML = `<li class="empty-msg" style="color:#ff6b6b;">⚠️ ${e.message}</li>`;
        }
    }

    // ========== Tìm từ nối ==========
    function findAndDisplay() {
        if (!isDictionaryReady) return;
        const raw = input.value.trim().toLowerCase();
        if (!raw) {
            resultCount.textContent = "0 từ";
            resultsList.innerHTML = '<li class="empty-msg">🔍 Nhập từ để tìm...</li>';
            return;
        }

        const lastWord = raw.split(/\s+/).pop();
        const prefix = lastWord + " ";
        const matches = dictionary.filter(w => w.startsWith(prefix));

        // Render với DocumentFragment
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
                li.style.transform = 'translateY(8px)';
                li.style.transition = `0.25s ease ${idx * 0.02}s`;
                li.addEventListener("click", () => copyWord(word, li));
                fragment.appendChild(li);
            });
        }

        resultsList.innerHTML = "";
        resultsList.appendChild(fragment);

        // Kích hoạt animation
        requestAnimationFrame(() => {
            resultsList.querySelectorAll("li:not(.empty-msg)").forEach(li => {
                li.style.opacity = '1';
                li.style.transform = 'translateY(0)';
            });
        });
    }

    // ========== Debounce tìm kiếm khi gõ tay ==========
    let debounceTimer;
    function debounceSearch() {
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
        // Hiệu ứng flash
        const original = element.textContent;
        element.textContent = "✅ Đã copy!";
        element.classList.add("copied-flash");
        setTimeout(() => {
            element.textContent = original;
            element.classList.remove("copied-flash");
        }, 900);
    }

    // ========== Tự động dán clipboard (khi load hoặc khi có text) ==========
    async function attemptAutoPaste() {
        if (!isDictionaryReady) return;
        try {
            // Yêu cầu quyền đọc clipboard (có thể bị từ chối nếu không HTTPS/localhost)
            const permission = await navigator.permissions.query({ name: "clipboard-read" });
            if (permission.state === "denied") {
                console.log("Quyền clipboard bị từ chối, người dùng tự paste.");
                return;
            }
            const text = await navigator.clipboard.readText();
            if (text && text.trim()) {
                input.value = text.trim();
                // Kích hoạt tìm kiếm ngay (không debounce)
                findAndDisplay();
            }
        } catch (err) {
            // Không có quyền hoặc lỗi – yên lặng, người dùng có thể paste thủ công
            console.log("Auto‑paste không khả dụng:", err.message);
        }
    }

    // ========== Sự kiện ==========
    // Khi người dùng paste thủ công (Ctrl+V hoặc chuột phải)
    input.addEventListener("paste", (e) => {
        // Đợi một chút để giá trị input cập nhật
        setTimeout(findAndDisplay, 10);
    });

    // Khi người dùng gõ phím (debounce)
    input.addEventListener("input", debounceSearch);

    // Nếu người dùng focus vào input, thử auto‑paste lại (phòng trường hợp chưa có quyền lúc đầu)
    input.addEventListener("focus", () => {
        if (!input.value.trim() && isDictionaryReady) {
            attemptAutoPaste();
        }
    });

    // Khởi động
    fetchDictionary();
})();

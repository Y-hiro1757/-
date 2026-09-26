// ========================================
// Firebase
// ========================================
import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    orderBy,
    query,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ========================================
// Firebase設定
// ========================================

const firebaseConfig = {
    apiKey: "AIzaSyB8tnjzFL1icQYSimQ9793p1z0018ZLEvc",
    authDomain: "or-brog.firebaseapp.com",
    projectId: "or-brog",
    storageBucket: "or-brog. firebasestorage.app",
    messagingSenderId: "645202791808",
    appId: "1:645202791808:web: c44ce0a20e1170a6710565"
};


// ========================================
// Firebaseを初期化
// ========================================

const firebaseApp = initializeApp(firebaseConfig);

// Firestoreに接続

const db = getFirestore(window.firebaseApp);

// ========================================
// スレッド関連の変数
// ========================================

let threads = [];

let currentThreadId = null;

let currentSort = "new";

let replyTarget = null;


// ========================================
// Firebaseからスレッドを読み込む
// ========================================

function loadThreads() {

    const threadsRef = collection(db, "threads");

    const q = query(
        threadsRef,
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, function(snapshot) {

        console.log("Firestore取得成功");
        console.log("取得件数:", snapshot.size);

        threads = [];

        snapshot.forEach(function(docData) {

            console.log("取得したスレッド:", docData.data());

            threads.push({
                id: docData.id,
                ...docData.data()
            });

        });

        console.log("threads:", threads);

        displayThreads();

    }, function(error) {

        console.error(
            "Firestore読み込みエラー:",
            error
        );

    });
}

// ========================================
// Firebaseから読み込み開始
// ========================================

loadThreads();

// ========================================
// ページを開いたとき
// ========================================

displayThreads();

// ========================================
// Firebaseにスレッドを作成
// ========================================

async function createThread() {

    const title =
        document.getElementById("threadTitle")
            .value
            .trim();


    const name =
        document.getElementById("threadName")
            .value
            .trim();


    const text =
        document.getElementById("threadText")
            .value
            .trim();


    // ====================================
    // 入力チェック
    // ====================================

    if (
        title === "" ||
        name === "" ||
        text === ""
    ) {

        alert(
            "タイトル・名前・本文を入力してください"
        );

        return;
    }


    try {

        // ==================================
        // Firebaseにスレッドを保存
        // ==================================

        await addDoc(
            collection(db, "threads"),
            {

                title: title,

                createdAt: serverTimestamp(),

                posts: [

                    {

                        name: name,

                        text: text,

                        date: Date.now(),

                        userId: createUserID(),

                        replyTo: null

                    }

                ]

            }
        );


        // ==================================
        // 入力欄を空にする
        // ==================================

        document.getElementById("threadTitle")
            .value = "";

        document.getElementById("threadName")
            .value = "";

        document.getElementById("threadText")
            .value = "";


        alert(
            "スレッドを作成しました！"
        );


    } catch (error) {

        console.error(
            "スレッド作成エラー:",
            error
        );


        alert(
            "スレッドを作成できませんでした。"
        );

    }
}

// ========================================
// スレッド一覧を表示
// ========================================

function displayThreads() {

    const list =
        document.getElementById("threadList");


    // 一度消す

    list.innerHTML = "";


    // 検索文字

    const searchBox =
        document.getElementById("searchBox");


    const search =
        searchBox.value
            .toLowerCase()
            .trim();


    // ====================================
    // スレッドをコピー
    // ====================================

    let sortedThreads =
        [...threads];


    // ====================================
    // 並び順
    // ====================================

    if (currentSort === "new") {

        sortedThreads.sort(function(a, b) {

            return (
                getLastPostTime(b) -
                getLastPostTime(a)
            );

        });

    }


    else if (currentSort === "posts") {

        sortedThreads.sort(function(a, b) {

            return (
                b.posts.length -
                a.posts.length
            );

        });

    }


    else if (currentSort === "speed") {

        sortedThreads.sort(function(a, b) {

            return (
                getSpeed(b) -
                getSpeed(a)
            );

        });

    }


    // ====================================
    // 検索
    // ====================================

    if (search !== "") {

        sortedThreads =
            sortedThreads.filter(function(thread) {

                return thread.title
                    .toLowerCase()
                    .includes(search);

            });

    }

    // ====================================
    // スレッドがない場合
    // ====================================

    if (sortedThreads.length === 0) {

        list.innerHTML =
            "<p>スレッドがありません。</p>";

        return;
    }


    // ====================================
    // スレッドを1つずつ表示
    // ====================================

    sortedThreads.forEach(function(thread) {

        const div =
            document.createElement("div");

        div.className = "thread";

        div.innerHTML = `

            <h3>
                ${escapeHTML(thread.title)}
            </h3>

            <div>
                💬 ${thread.posts.length}レス
            </div>

            <div>
                🔥 勢い ${getSpeed(thread)}レス/時
            </div>

            <div>
                🕐 最終更新
                ${formatDate(getLastPostTime(thread))}
            </div>

        `;

        div.onclick = function() {

            openThread(thread.id);

        };

        list.appendChild(div);

    });

}

// ========================================
// スレッドを開く
// ========================================

function openThread(id) {

    currentThreadId = id;


    // Firebaseから取得したスレッドを探す

    const thread =
        threads.find(function(thread) {

            return thread.id === id;

        });


    if (!thread) {

        alert("スレッドが見つかりません");

        return;
    }


    // ====================================
    // スレッド一覧を隠す
    // ====================================

    document.getElementById("threadArea")
        .style.display = "none";


    // ====================================
    // スレッド作成フォームを隠す
    // ====================================

    document.querySelector(".create-area")
        .style.display = "none";


    // ====================================
    // スレッド画面を表示
    // ====================================

    document.getElementById("threadView")
        .style.display = "block";


    // ====================================
    // タイトルを表示
    // ====================================

    document.getElementById("viewTitle")
        .textContent = thread.title;


    // ====================================
    // 返信先をリセット
    // ====================================

    replyTarget = null;


    document.getElementById("replyTarget")
        .textContent = "返信先：なし";


    // ====================================
    // レスを表示
    // ====================================

    displayPosts(thread);

    displayThreadStats(thread);
}

// ========================================
// スレッド情報を表示
// ========================================

function displayThreadStats(thread) {

    const stats =
        document.getElementById("threadStats");

    stats.innerHTML = `

        💬 ${thread.posts.length}レス　

        🔥 勢い ${getSpeed(thread)}レス/時　

        🕐 最終更新

        ${formatDate(
            getLastPostTime(thread)
        )}

    `;
}

// ========================================
// レスを表示
// ========================================

function displayPosts(thread) {

    const postList =
        document.getElementById("postList");

    // 一度消す
    postList.innerHTML = "";

    // レスがない場合
    if (
        !thread.posts ||
        thread.posts.length === 0
    ) {

        postList.innerHTML =
            "<p>まだレスがありません。</p>";

        return;
    }


    // ====================================
    // レスを1つずつ表示
    // ====================================

    thread.posts.forEach(
        function(post, index) {

            const div =
                document.createElement("div");

            div.className = "post";


            // ==================================
            // 返信先
            // ==================================

            let reference = "";

            if (post.replyTo !== null) {

                const target =
                    thread.posts[
                        post.replyTo - 1
                    ];

                if (target) {

                    reference =
                        '<div class="reply-reference">' +
                            '>>' +
                            post.replyTo +
                            ' ' +
                            escapeHTML(target.text) +
                        '</div>';
                }
            }


            // ==================================
            // レスを表示
            // ==================================

            div.innerHTML = `

                <div>

                    <span class="post-number">
                        ${index + 1}
                    </span>

                    <span class="post-name">
                        ${escapeHTML(post.name)}
                    </span>

                    <span class="post-id">
                        ID:${post.userId}
                    </span>

                    <span class="post-date">
                        ${formatDate(post.date)}
                    </span>

                </div>


                ${reference}


                <div class="post-text">
                    ${escapeHTML(post.text)
                        .replace(/\n/g, "<br>")}
                </div>


                <div
                    class="reply-link"
                    onclick="setReply(${index + 1})"
                >
                    ↩ このレスに返信
                </div>

            `;


            // ==================================
            // 画面に追加
            // ==================================

            postList.appendChild(div);

        }
    );
};

// ========================================
// レスを書き込む
// ========================================

async function addReply() {

    const name =
        document.getElementById("replyName")
            .value
            .trim();


    const text =
        document.getElementById("replyText")
            .value
            .trim();


    // ====================================
    // 入力チェック
    // ====================================

    if (name === "" || text === "") {

        alert(
            "名前と本文を入力してください"
        );

        return;
    }


    // ====================================
    // 現在のスレッドを探す
    // ====================================

    const thread =
        threads.find(function(thread) {

            return thread.id === currentThreadId;

        });


    if (!thread) {

        alert("スレッドが見つかりません");

        return;
    }


    try {

        // ==================================
        // 新しいレスを作る
        // ==================================

        const post = {

            name: name,

            text: text,

            date: Date.now(),

            userId: createUserID(),

            replyTo: replyTarget

        };


        // ==================================
        // Firebase用のスレッド参照
        // ==================================

        const threadRef =
            doc(db, "threads", currentThreadId);


        // ==================================
        // 既存のレスに追加
        // ==================================

        const newPosts = [

            ...(thread.posts || []),

            post

        ];


        // ==================================
        // Firebaseを更新
        // ==================================

        await updateDoc(

            threadRef,

            {

                posts: newPosts

            }

        );


        // ==================================
        // 入力欄を空にする
        // ==================================

        document.getElementById("replyName")
            .value = "";

        document.getElementById("replyText")
            .value = "";


        // ==================================
        // 返信先をリセット
        // ==================================

        replyTarget = null;


        document.getElementById("replyTarget")
            .textContent = "返信先：なし";


        console.log(
            "レスを投稿しました"
        );


    } catch (error) {

        console.error(
            "レス投稿エラー:",
            error
        );


        alert(
            "レスを投稿できませんでした"
        );

    }
}

// ========================================
// 返信先を設定
// ========================================

function setReply(number) {

    replyTarget = number;


    document.getElementById("replyTarget")
        .textContent =
        "返信先：>>" + number;


    // 本文入力欄に移動

    document.getElementById("replyText")
        .focus();
}

// ========================================
// スレッド一覧に戻る
// ========================================

function showThreadList() {

    // ====================================
    // スレッド画面を隠す
    // ====================================

    document.getElementById("threadView")
        .style.display = "none";


    // ====================================
    // スレッド一覧を表示
    // ====================================

    document.getElementById("threadArea")
        .style.display = "block";


    // ====================================
    // スレッド作成フォームを表示
    // ====================================

    document.querySelector(".create-area")
        .style.display = "block";


    // ====================================
    // 現在のスレッドを解除
    // ====================================

    currentThreadId = null;

    replyTarget = null;


    // ====================================
    // 返信先をリセット
    // ====================================

    document.getElementById("replyTarget")
        .textContent = "返信先：なし";


    // ====================================
    // Firebaseから取得済みの
    // 最新データを表示
    // ====================================

    displayThreads();
}


// ========================================
// 勢いを計算
// ========================================

function getSpeed(thread) {

    // レスが1個以下ならレス数をそのまま表示
    if (thread.posts.length <= 1) {

        return thread.posts.length;
    }


    // 最初のレス
    const first =
        thread.posts[0].date;


    // 最後のレス
    const last =
        getLastPostTime(thread);


    // 経過時間を時間単位にする
    const hours =
        (last - first) /
        (1000 * 60 * 60);


    // 1時間未満ならレス数を表示
    if (hours <= 0) {

        return thread.posts.length;
    }


    // レス数 ÷ 経過時間
    const speed =
        thread.posts.length / hours;


    // 小数第1位まで
    return Math.round(speed * 10) / 10;
}


// ========================================
// 最後のレスの時間を取得
// ========================================

function getLastPostTime(thread) {

    // レスが存在しない場合
    if (
        !thread.posts ||
        thread.posts.length === 0
    ) {

        return thread.createdAt;
    }

    // 最後のレスの日時を返す
    return thread.posts[
        thread.posts.length - 1
    ].date;
}


// ========================================
// IDを作る
// ========================================

function createUserID() {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let id = "";

    // 8文字のIDを作る
    for (let i = 0; i < 8; i++) {

        const random =
            Math.floor(
                Math.random() *
                characters.length
            );

        id += characters[random];
    }

    return id;
}


// ========================================
// 日付を表示
// ========================================

function formatDate(timestamp) {

    const date =
        new Date(timestamp);

    return date.toLocaleString(
        "ja-JP",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

// ========================================
// HTMLを安全に表示する
// ========================================

function escapeHTML(text) {

    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

window.createThread = createThread;
window.addReply = addReply;
window.setReply = setReply;
window.openThread = openThread;
window.showThreadList = showThreadList;
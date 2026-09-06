
const $ = (id) => document.getElementById(id);

/* =========================================================
   URUTAN PILIHAN PORSI
   ========================================================= */
const portionOrder = [
  ["sekolah", "porsi_kecil", "Sekolah — Porsi Kecil"],
  ["sekolah", "porsi_besar", "Sekolah — Porsi Besar"],
  ["3b", "balita", "3B — Balita"],
  ["3b", "bumil", "3B — Bumil"],
  ["3b", "busui", "3B — Busui"]
];


/* =========================================================
   TANGGAL HARI INI - ASIA/JAKARTA
   ========================================================= */
function jakartaToday() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());

  const get = (type) => {
    const item = parts.find((part) => part.type === type);
    return item ? item.value : "";
  };

  return `${get("year")}-${get("month")}-${get("day")}`;
}


/* =========================================================
   ESCAPE HTML
   ========================================================= */
function esc(value) {
  const d = document.createElement("div");
  d.textContent = value ?? "";
  return d.innerHTML;
}


/* =========================================================
   SHOW / HIDE ELEMENT
   ========================================================= */
function show(id) {
  const el = $(id);
  if (el) el.classList.remove("d-none");
}

function hide(id) {
  const el = $(id);
  if (el) el.classList.add("d-none");
}


/* =========================================================
   FORMAT ANGKA
   ========================================================= */
function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return esc(value);
  }

  return number.toLocaleString("id-ID");
}


/* =========================================================
   LOAD MENU HARI INI
   ========================================================= */
async function loadToday() {

  /* Reset tampilan */
  hide("empty");
  hide("error");
  hide("content");
  show("loading");


  /* ---------------------------------------------------------
     TANGGAL
     --------------------------------------------------------- */
  const today = jakartaToday();

  const dateText = $("dateText");

  if (dateText) {
    dateText.textContent = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(
      new Date(`${today}T00:00:00+07:00`)
    );
  }


  /* ---------------------------------------------------------
     CEK SUPABASE
     --------------------------------------------------------- */
  if (typeof sb === "undefined") {
    hide("loading");

    const errorText = $("errorText");

    if (errorText) {
      errorText.textContent =
        "Konfigurasi Supabase belum tersedia. Periksa assets/js/config.js.";
    }

    show("error");
    return;
  }


  /* ---------------------------------------------------------
     AMBIL MENU HARIAN
     --------------------------------------------------------- */
  let menu;

  try {

    const result = await sb
      .from("menu_harian")
      .select("*")
      .eq("tanggal", today)
      .maybeSingle();

    const { data, error } = result;

    if (error) {
      throw new Error(
        error.message || "Gagal mengambil data menu."
      );
    }

    menu = data;

  } catch (error) {

    console.error("Menu error:", error);

    hide("loading");

    const errorText = $("errorText");

    if (errorText) {
      errorText.textContent =
        error.message || "Gagal mengambil data menu.";
    }

    show("error");
    return;
  }


  /* ---------------------------------------------------------
     JIKA MENU BELUM TERSEDIA
     --------------------------------------------------------- */
  if (!menu) {

    hide("loading");
    show("empty");

    return;
  }


  /* ---------------------------------------------------------
     AMBIL KANDUNGAN GIZI
     --------------------------------------------------------- */
  let nutrition = [];

  try {

    const result = await sb
      .from("kandungan_gizi")
      .select("*")
      .eq("menu_id", menu.id);

    const { data, error } = result;

    if (error) {
      throw new Error(
        error.message || "Gagal mengambil kandungan gizi."
      );
    }

    nutrition = data || [];

  } catch (error) {

    console.error("Nutrition error:", error);

    hide("loading");

    const errorText = $("errorText");

    if (errorText) {
      errorText.textContent =
        error.message || "Gagal mengambil kandungan gizi.";
    }

    show("error");
    return;
  }


  /* =========================================================
     TAMPILKAN INFORMASI MENU
     ========================================================= */

  const menuName = $("menuName");
  const menuDesc = $("menuDesc");

  if (menuName) {
    menuName.textContent = menu.nama_menu || "-";
  }

  if (menuDesc) {
    menuDesc.textContent = menu.deskripsi || "";
  }


  /* =========================================================
     DAFTAR MENU MAKANAN
     ========================================================= */

  const items = [
    menu.item1,
    menu.item2,
    menu.item3,
    menu.item4,
    menu.item5
  ].filter(Boolean);


  const menuItems = $("menuItems");

  if (menuItems) {

    if (items.length) {

      menuItems.innerHTML = items
        .map((item, index) => `
          <div class="menu-item">
            <span>${index + 1}</span>
            <strong>${esc(item)}</strong>
          </div>
        `)
        .join("");

    } else {

      menuItems.innerHTML = `
        <div class="text-muted">
          Belum ada rincian menu.
        </div>
      `;
    }
  }


  /* =========================================================
     DATA PORSI
     ========================================================= */

  const available = new Map(
    nutrition.map((item) => [
      `${item.kelompok}|${item.porsi}`,
      item
    ])
  );


  let activeKey = null;

  const portionButtons = $("portionButtons");


  /* ---------------------------------------------------------
     BUAT TOMBOL PORSI
     --------------------------------------------------------- */
  if (portionButtons) {

    const availablePortions = portionOrder.filter(
      ([kelompok, porsi]) =>
        available.has(`${kelompok}|${porsi}`)
    );


    if (availablePortions.length) {

      portionButtons.innerHTML = availablePortions
        .map(([kelompok, porsi, label], index) => {

          const key = `${kelompok}|${porsi}`;

          if (index === 0) {
            activeKey = key;
          }

          return `
            <button
              type="button"
              class="portion-btn ${index === 0 ? "active" : ""}"
              data-key="${esc(key)}"
            >
              ${esc(label)}
            </button>
          `;
        })
        .join("");

    } else {

      portionButtons.innerHTML = `
        <div class="text-muted">
          Kandungan gizi belum tersedia.
        </div>
      `;
    }
  }


  /* =========================================================
     RENDER KANDUNGAN GIZI
     ========================================================= */

  function renderNutrition(key) {

    const n = available.get(key);

    if (!n) {
      return;
    }


    /* -------------------------------------------------------
       JUDUL PORSI
       ------------------------------------------------------- */

    const portionTitle = $("portionTitle");

    if (portionTitle) {

      const label =
        portionOrder.find(
          ([kelompok, porsi]) =>
            `${kelompok}|${porsi}` === key
        )?.[2] || "Per porsi";

      portionTitle.textContent = label;
    }


    /* -------------------------------------------------------
       NILAI GIZI
       ------------------------------------------------------- */

    const values = [
  ["Energi", n.energi, "kcal"],
  ["Protein", n.protein, "g"],
  ["Lemak", n.lemak, "g"],
  ["Karbohidrat", n.karbohidrat, "g"],
  ["Serat", n.serat, "g"]
];


    const nutritionGrid = $("nutritionGrid");

    if (!nutritionGrid) {
      return;
    }


    nutritionGrid.innerHTML = values
      .map(([name, value, unit]) => `
        <div class="nutrition-item">
          <span>${esc(name)}</span>
          <strong>
            ${formatNumber(value)}
            <small>${esc(unit)}</small>
          </strong>
        </div>
      `)
      .join("");
  }


  /* =========================================================
     EVENT TOMBOL PORSI
     ========================================================= */

  document
    .querySelectorAll(".portion-btn")
    .forEach((button) => {

      button.addEventListener("click", () => {

        document
          .querySelectorAll(".portion-btn")
          .forEach((item) => {
            item.classList.remove("active");
          });


        button.classList.add("active");


        renderNutrition(
          button.dataset.key
        );

      });

    });


  /* =========================================================
     TAMPILKAN PORSI PERTAMA
     ========================================================= */

  if (activeKey) {

    renderNutrition(activeKey);

  } else {

    const nutritionGrid = $("nutritionGrid");

    if (nutritionGrid) {
      nutritionGrid.innerHTML = "";
    }
  }


  /* =========================================================
     SELESAI LOADING
     ========================================================= */

  hide("loading");
  show("content");
}


/* =========================================================
   JALANKAN
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadToday();
});

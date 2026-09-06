const $ = (id) => document.getElementById(id);


/* =========================================================
   DAFTAR PORSI
   ========================================================= */

const portions = [
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

    const item = parts.find(
      (part) => part.type === type
    );

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
   PESAN FORM
   ========================================================= */

function setFormMessage(
  text,
  type = "success"
) {

  const el = $("formMsg");

  if (!el) return;

  el.textContent = text;

  el.className =
    `alert alert-${type}`;
}


function clearFormMessage() {

  const el = $("formMsg");

  if (!el) return;

  el.textContent = "";

  el.className =
    "alert d-none";
}


/* =========================================================
   CEK SUPABASE
   ========================================================= */

function supabaseReady() {

  return (
    typeof sb !== "undefined" &&
    sb
  );
}


/* =========================================================
   BATASI ANGKA MAKSIMAL 3 DESIMAL
   ========================================================= */

function bindNutritionInputs() {

  document
    .querySelectorAll(".nutrition-input")
    .forEach((input) => {

      input.addEventListener(
        "input",
        function () {

          let value = this.value;

          /*
           * Hapus karakter selain angka
           * dan titik desimal.
           */

          value = value.replace(
            /[^0-9.]/g,
            ""
          );


          /*
           * Jika terdapat lebih dari satu titik,
           * hanya gunakan titik pertama.
           */

          const firstDot =
            value.indexOf(".");

          if (firstDot !== -1) {

            const integerPart =
              value.substring(
                0,
                firstDot
              );

            let decimalPart =
              value.substring(
                firstDot + 1
              );


            /*
             * Maksimal 3 angka setelah titik
             */

            decimalPart =
              decimalPart
                .replace(/\./g, "")
                .substring(0, 3);


            value =
              `${integerPart}.${decimalPart}`;
          }


          this.value = value;
        }
      );

    });
}


/* =========================================================
   BUILD FORM KANDUNGAN GIZI
   ========================================================= */

function buildNutritionForms(
  values = {}
) {

  const container =
    $("nutritionForms");

  if (!container) return;


  container.innerHTML =
    portions
      .map(
        ([
          kelompok,
          porsi,
          label
        ]) => {

          const n =
            values[
              `${kelompok}|${porsi}`
            ] || {};


          /* -------------------------------------------------
             INPUT GIZI
             ------------------------------------------------- */

          const input = (
            field,
            unit
          ) => {

            const fieldName =
              field.toLowerCase();


            return `
              <div class="col-6 col-md-2">

                <label class="form-label small">
                  ${esc(field)} (${esc(unit)})
                </label>

                <input
                  class="form-control nutrition-input"
                  data-field="${esc(fieldName)}"
                  data-group="${esc(kelompok)}"
                  data-portion="${esc(porsi)}"
                  type="number"
                  step="0.001"
                  min="0"
                  inputmode="decimal"
                  value="${n[fieldName] ?? ""}"
                >

              </div>
            `;
          };


          return `
            <div class="portion-form">

              <div class="portion-form-title">
                ${esc(label)}
              </div>


              <div class="row g-2">

                ${input("Energi", "kcal")}

                ${input("Protein", "g")}

                ${input("Lemak", "g")}

                ${input("Karbohidrat", "g")}

                ${input("Serat", "g")}

              </div>

            </div>
          `;
        }
      )
      .join("");


  /*
   * Aktifkan pembatasan maksimal
   * 3 angka desimal.
   */

  bindNutritionInputs();
}


/* =========================================================
   RESET FORM
   ========================================================= */

function resetForm() {

  const form =
    $("menuForm");


  if (form) {
    form.reset();
  }


  const menuId =
    $("menuId");


  if (menuId) {
    menuId.value = "";
  }


  const tanggal =
    $("tanggal");


  if (tanggal) {
    tanggal.value =
      jakartaToday();
  }


  buildNutritionForms();

  clearFormMessage();
}


/* =========================================================
   LOAD SEMUA MENU
   ========================================================= */

async function loadMenus() {

  if (!supabaseReady()) {

    setFormMessage(
      "Supabase belum terhubung. Periksa config.js.",
      "danger"
    );

    return;
  }


  const {
    data,
    error
  } = await sb
    .from("menu_harian")
    .select("*")
    .order(
      "tanggal",
      {
        ascending: false
      }
    );


  if (error) {

    console.error(
      "Load menu error:",
      error
    );


    const menuTable =
      $("menuTable");


    if (menuTable) {

      menuTable.innerHTML = `
        <tr>
          <td
            colspan="3"
            class="text-danger"
          >
            ${esc(error.message)}
          </td>
        </tr>
      `;
    }


    return;
  }


  const menuTable =
    $("menuTable");


  if (!menuTable) return;


  menuTable.innerHTML =
    (data || [])
      .map(
        (menu) => {

          return `
            <tr>

              <td>
                ${esc(menu.tanggal)}
              </td>

              <td>
                <strong>
                  ${esc(menu.nama_menu)}
                </strong>
              </td>

              <td class="text-nowrap">

                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary edit-btn"
                  data-id="${esc(menu.id)}"
                >
                  Edit
                </button>


                <button
                  type="button"
                  class="btn btn-sm btn-outline-danger delete-btn"
                  data-id="${esc(menu.id)}"
                >
                  Hapus
                </button>

              </td>

            </tr>
          `;
        }
      )
      .join("")

    ||

    `
      <tr>
        <td
          colspan="3"
          class="text-muted"
        >
          Belum ada menu.
        </td>
      </tr>
    `;


  /* =======================================================
     EVENT EDIT
     ======================================================= */

  document
    .querySelectorAll(".edit-btn")
    .forEach(
      (button) => {

        button.onclick = () => {

          editMenu(
            button.dataset.id
          );

        };

      }
    );


  /* =======================================================
     EVENT DELETE
     ======================================================= */

  document
    .querySelectorAll(".delete-btn")
    .forEach(
      (button) => {

        button.onclick = () => {

          deleteMenu(
            button.dataset.id
          );

        };

      }
    );
}


/* =========================================================
   EDIT MENU
   ========================================================= */

async function editMenu(id) {

  clearFormMessage();


  if (!supabaseReady()) {

    setFormMessage(
      "Supabase belum terhubung.",
      "danger"
    );

    return;
  }


  /* =======================================================
     AMBIL DATA MENU
     ======================================================= */

  const {
    data: menu,
    error: menuError
  } = await sb
    .from("menu_harian")
    .select("*")
    .eq("id", id)
    .single();


  if (menuError) {

    console.error(
      "Edit menu error:",
      menuError
    );


    setFormMessage(
      menuError.message ||
      "Gagal mengambil data menu.",
      "danger"
    );


    return;
  }


  /* =======================================================
     AMBIL DATA GIZI
     ======================================================= */

  const {
    data: nutrition,
    error: nutritionError
  } = await sb
    .from("kandungan_gizi")
    .select("*")
    .eq("menu_id", id);


  if (nutritionError) {

    console.error(
      "Nutrition error:",
      nutritionError
    );


    setFormMessage(
      nutritionError.message ||
      "Gagal mengambil kandungan gizi.",
      "danger"
    );


    return;
  }


  /* =======================================================
     ISI FORM MENU
     ======================================================= */

  if ($("menuId")) {

    $("menuId").value =
      menu.id || "";

  }


  if ($("tanggal")) {

    $("tanggal").value =
      menu.tanggal || "";

  }


  if ($("nama_menu")) {

    $("nama_menu").value =
      menu.nama_menu || "";

  }


  if ($("deskripsi")) {

    $("deskripsi").value =
      menu.deskripsi || "";

  }


  if ($("item1")) {

    $("item1").value =
      menu.item1 || "";

  }


  if ($("item2")) {

    $("item2").value =
      menu.item2 || "";

  }


  if ($("item3")) {

    $("item3").value =
      menu.item3 || "";

  }


  if ($("item4")) {

    $("item4").value =
      menu.item4 || "";

  }


  if ($("item5")) {

    $("item5").value =
      menu.item5 || "";

  }


  /*
   * ALERGEN SUDAH DIHAPUS
   *
   * Tidak ada lagi:
   *
   * $("alergen").value = ...
   */


  /* =======================================================
     BUAT MAP DATA GIZI
     ======================================================= */

  const map = {};


  (nutrition || [])
    .forEach(
      (item) => {

        map[
          `${item.kelompok}|${item.porsi}`
        ] = item;

      }
    );


  buildNutritionForms(map);


  /* =======================================================
     SCROLL KE FORM
     ======================================================= */

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


/* =========================================================
   DELETE MENU
   ========================================================= */

async function deleteMenu(id) {

  if (
    !confirm(
      "Hapus menu ini beserta kandungan gizinya?"
    )
  ) {

    return;
  }


  if (!supabaseReady()) {

    setFormMessage(
      "Supabase belum terhubung.",
      "danger"
    );

    return;
  }


  /* =======================================================
     HAPUS KANDUNGAN GIZI
     ======================================================= */

  const {
    error: nutritionError
  } = await sb
    .from("kandungan_gizi")
    .delete()
    .eq(
      "menu_id",
      id
    );


  if (nutritionError) {

    console.error(
      "Delete nutrition error:",
      nutritionError
    );


    setFormMessage(
      `Gagal menghapus kandungan gizi: ${nutritionError.message}`,
      "danger"
    );


    return;
  }


  /* =======================================================
     HAPUS MENU
     ======================================================= */

  const {
    error: menuError
  } = await sb
    .from("menu_harian")
    .delete()
    .eq(
      "id",
      id
    );


  if (menuError) {

    console.error(
      "Delete menu error:",
      menuError
    );


    setFormMessage(
      menuError.message ||
      "Gagal menghapus menu.",
      "danger"
    );


    return;
  }


  setFormMessage(
    "Menu berhasil dihapus."
  );


  resetForm();

  await loadMenus();
}


/* =========================================================
   SIMPAN MENU
   ========================================================= */

async function saveMenu(event) {

  event.preventDefault();

  clearFormMessage();


  if (!supabaseReady()) {

    setFormMessage(
      "Supabase belum terhubung. Periksa config.js.",
      "danger"
    );

    return;
  }


  /* =======================================================
     VALIDASI DASAR
     ======================================================= */

  const tanggal =
    $("tanggal")?.value || "";


  const namaMenu =
    $("nama_menu")
      ?.value
      .trim() || "";


  if (!tanggal) {

    setFormMessage(
      "Tanggal menu wajib diisi.",
      "danger"
    );

    return;
  }


  if (!namaMenu) {

    setFormMessage(
      "Nama menu wajib diisi.",
      "danger"
    );

    return;
  }


  /* =======================================================
     PAYLOAD MENU
     ======================================================= */

  const payload = {

    tanggal:
      tanggal,

    nama_menu:
      namaMenu,

    deskripsi:
      $("deskripsi")
        ?.value
        .trim() || null,

    item1:
      $("item1")
        ?.value
        .trim() || null,

    item2:
      $("item2")
        ?.value
        .trim() || null,

    item3:
      $("item3")
        ?.value
        .trim() || null,

    item4:
      $("item4")
        ?.value
        .trim() || null,

    item5:
      $("item5")
        ?.value
        .trim() || null
  };


  /*
   * Field "alergen" sengaja tidak dikirim.
   */


  /* =======================================================
     INSERT / UPDATE MENU
     ======================================================= */

  let menu;

  let error;


  if (
    $("menuId")?.value
  ) {

    ({
      data: menu,
      error
    } = await sb
      .from("menu_harian")
      .update(payload)
      .eq(
        "id",
        $("menuId").value
      )
      .select()
      .single());

  } else {

    ({
      data: menu,
      error
    } = await sb
      .from("menu_harian")
      .insert(payload)
      .select()
      .single());

  }


  if (error) {

    console.error(
      "Save menu error:",
      error
    );


    setFormMessage(
      error.message ||
      "Menu gagal disimpan.",
      "danger"
    );


    return;
  }


  if (!menu) {

    setFormMessage(
      "Menu gagal disimpan karena data tidak ditemukan.",
      "danger"
    );


    return;
  }


  /* =======================================================
     SIAPKAN DATA KANDUNGAN GIZI
     ======================================================= */

  const rows =
    portions.map(
      ([kelompok, porsi]) => {

        const row = {

          menu_id:
            menu.id,

          kelompok:
            kelompok,

          porsi:
            porsi
        };


        document
          .querySelectorAll(
            `.nutrition-input[data-group="${kelompok}"][data-portion="${porsi}"]`
          )
          .forEach(
            (input) => {

              row[
                input.dataset.field
              ] =
                input.value === ""
                  ? null
                  : Number(
                      input.value
                    );

            }
          );


        return row;
      }
    );


  /* =======================================================
     SIMPAN KANDUNGAN GIZI
     ======================================================= */

  const {
    error: nutritionError
  } = await sb
    .from("kandungan_gizi")
    .upsert(
      rows,
      {
        onConflict:
          "menu_id,porsi"
      }
    );


  if (nutritionError) {

    console.error(
      "Save nutrition error:",
      nutritionError
    );


    setFormMessage(
      `Menu berhasil tersimpan, tetapi kandungan gizi gagal disimpan: ${nutritionError.message}`,
      "danger"
    );


    return;
  }


  /* =======================================================
     BERHASIL
     ======================================================= */

  setFormMessage(
    "Menu dan kandungan gizi berhasil disimpan."
  );


  resetForm();

  await loadMenus();
}


/* =========================================================
   INISIALISASI
   ========================================================= */

async function init() {

  /* =======================================================
     BUILD FORM
     ======================================================= */

  buildNutritionForms();

  resetForm();


  /* =======================================================
     CEK SUPABASE
     ======================================================= */

  if (!supabaseReady()) {

    console.error(
      "Supabase client tidak ditemukan."
    );


    showLogin();

    return;
  }


  /* =======================================================
     CEK SESSION
     ======================================================= */

  const {
    data: {
      session
    }
  } = await sb.auth.getSession();


  if (session) {

    showDashboard();

  } else {

    showLogin();

  }


  /* =======================================================
     AUTH STATE CHANGE
     ======================================================= */

  sb.auth.onAuthStateChange(
    (_event, session) => {

      if (session) {

        showDashboard();

      } else {

        showLogin();

      }

    }
  );


  /* =======================================================
     LOGIN
     ======================================================= */

  const loginForm =
    $("loginForm");


  if (loginForm) {

    loginForm.addEventListener(
      "submit",
      async (event) => {

        event.preventDefault();


        const loginMsg =
          $("loginMsg");


        if (loginMsg) {

          loginMsg.textContent =
            "Memproses...";

        }


        const email =
          $("email")
            ?.value
            .trim() || "";


        const password =
          $("password")
            ?.value || "";


        if (!email || !password) {

          if (loginMsg) {

            loginMsg.textContent =
              "Email dan password wajib diisi.";

          }


          return;
        }


        const {
          error
        } =
          await sb.auth
            .signInWithPassword({
              email:
                email,

              password:
                password
            });


        if (loginMsg) {

          loginMsg.textContent =
            error
              ? error.message
              : "";

        }

      }
    );
  }


  /* =======================================================
     LOGOUT
     ======================================================= */

  const logoutBtn =
    $("logoutBtn");


  if (logoutBtn) {

    logoutBtn.onclick =
      async () => {

        await sb.auth.signOut();

      };

  }


  /* =======================================================
     MENU FORM
     ======================================================= */

  const menuForm =
    $("menuForm");


  if (menuForm) {

    menuForm.addEventListener(
      "submit",
      saveMenu
    );

  }


  /* =======================================================
     NEW BUTTON
     ======================================================= */

  const newBtn =
    $("newBtn");


  if (newBtn) {

    newBtn.onclick =
      () => {

        resetForm();

      };

  }


  /* =======================================================
     CANCEL BUTTON
     ======================================================= */

  const cancelBtn =
    $("cancelBtn");


  if (cancelBtn) {

    cancelBtn.onclick =
      () => {

        resetForm();

      };

  }


  /* =======================================================
     LOAD DATA
     ======================================================= */

  if (session) {

    await loadMenus();

  }
}


/* =========================================================
   TAMPILKAN DASHBOARD
   ========================================================= */

function showDashboard() {

  const loginPanel =
    $("loginPanel");

  const dashboard =
    $("dashboard");

  const logoutBtn =
    $("logoutBtn");


  if (loginPanel) {

    loginPanel.classList.add(
      "d-none"
    );

  }


  if (dashboard) {

    dashboard.classList.remove(
      "d-none"
    );

  }


  if (logoutBtn) {

    logoutBtn.classList.remove(
      "d-none"
    );

  }
}


/* =========================================================
   TAMPILKAN LOGIN
   ========================================================= */

function showLogin() {

  const loginPanel =
    $("loginPanel");

  const dashboard =
    $("dashboard");

  const logoutBtn =
    $("logoutBtn");


  if (loginPanel) {

    loginPanel.classList.remove(
      "d-none"
    );

  }


  if (dashboard) {

    dashboard.classList.add(
      "d-none"
    );

  }


  if (logoutBtn) {

    logoutBtn.classList.add(
      "d-none"
    );

  }
}


/* =========================================================
   START
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  init
);

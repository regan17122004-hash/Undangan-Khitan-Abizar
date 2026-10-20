const $ = id => document.getElementById(id);
["nama1","nama2"].forEach(i => $(i).textContent = D.nama);
$("nama3").textContent = "";
$("ortu").textContent = D.ortu;
$("tempat").textContent = D.tempat;
$("alamat").textContent = D.alamat;
$("maps").href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(D.alamat);
$("acara").innerHTML = D.acara.map(a =>
  `<article class="hari">
    <div class="hari-tanggal">
      <span class="hari-bulan">${a.tanggal.split(" ")[1]}</span>
      <b>${a.tanggal.split(" ")[0]}</b>
    </div>
    <div class="hari-info">
      <span class="hari-label">Hari Acara</span>
      <b>${a.hari}, ${a.tanggal}</b>
      <span class="hari-waktu">${a.waktu}</span>
    </div>
    <span class="hari-ornamen" aria-hidden="true">✦</span>
  </article>`).join("");

const revealElements = document.querySelectorAll("#isi > section, #isi > footer, .hari, .cd > div");
revealElements.forEach((element, index) => {
  element.classList.add("reveal");
  element.style.setProperty("--reveal-delay", `${(index % 4) * 90}ms`);
});
document.body.classList.add("motion-ready");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  revealElements.forEach(element => revealObserver.observe(element));
} else {
  revealElements.forEach(element => element.classList.add("is-visible"));
}

const to = new URLSearchParams(location.search).get("to");
if (to) { $("tamu").textContent = to; $("tamuBox").hidden = false; $("n").value = to; }

const musicToggle = $("musicToggle");
const musicLabel = $("musicLabel");
const backgroundMusic = $("backgroundMusic");
let musicPlaying = false;
let musicStatus = "Musik undangan";

const updateMusicButton = () => {
  musicToggle.classList.toggle("is-playing", musicPlaying);
  musicToggle.setAttribute("aria-pressed", String(musicPlaying));
  musicToggle.setAttribute("aria-label", musicPlaying ? "Jeda musik latar" : "Putar musik latar");
  musicLabel.textContent = musicPlaying ? "Jeda musik" : musicStatus;
};

const startMusic = async () => {
  musicToggle.disabled = true;
  try {
    musicStatus = "Musik undangan";
    updateMusicButton();
    if (backgroundMusic.paused) await backgroundMusic.play();
    musicPlaying = true;
    updateMusicButton();
  } catch (error) {
    musicPlaying = false;
    if (error.name === "NotAllowedError") {
      musicStatus = "Ketuk untuk putar";
    } else {
      musicStatus = "Musik gagal dimuat";
      console.error("Gagal memutar assets/musik-undangan.mp3:", error);
    }
    updateMusicButton();
  } finally {
    musicToggle.disabled = false;
  }
};

const stopMusic = () => {
  backgroundMusic.pause();
  musicPlaying = false;
  updateMusicButton();
};

musicToggle.addEventListener("click", () => {
  if (musicPlaying) stopMusic();
  else startMusic();
});

backgroundMusic.addEventListener("play", () => {
  musicPlaying = true;
  musicStatus = "Musik undangan";
  updateMusicButton();
});

backgroundMusic.addEventListener("pause", () => {
  musicPlaying = false;
  musicStatus = "Musik undangan";
  updateMusicButton();
});

backgroundMusic.addEventListener("error", () => {
  musicPlaying = false;
  musicStatus = "Musik gagal dimuat";
  updateMusicButton();
  console.error("File audio tidak dapat dimuat:", backgroundMusic.error);
});

startMusic();

$("buka").onclick = () => {
  document.body.classList.remove("locked");
  document.documentElement.style.overflow = "auto";
  document.body.style.overflow = "auto";
  requestAnimationFrame(() => {
    window.scrollTo({
      top: $("isi").getBoundingClientRect().top + window.scrollY,
      behavior: "smooth"
    });
  });
  if (!musicPlaying) startMusic();
};

const t = new Date(D.mulai).getTime();
const tick = () => {
  const s = Math.max(0, Math.floor((t - Date.now()) / 1000));
  [Math.floor(s/86400), Math.floor(s%86400/3600), Math.floor(s%3600/60), s%60]
    .forEach((v,i) => $("c"+i).textContent = v);
};
tick(); setInterval(tick, 1000);

$("kalender").href = "https://calendar.google.com/calendar/render?action=TEMPLATE" +
  "&text=" + encodeURIComponent("Khitanan " + D.nama) +
  "&dates=20261025T010000Z/20261025T020000Z" +
  "&location=" + encodeURIComponent(D.alamat);

$("salin").onclick = async e => {
  try { await navigator.clipboard.writeText(D.alamat); e.target.textContent = "Alamat tersalin"; }
  catch { e.target.textContent = "Salin manual dari teks"; }
};

const RSVP_STORAGE_KEY = "undangan-khitanan-rsvp";
const rsvpForm = $("rsvp");
const rsvpEntries = $("rsvpEntries");
const rsvpFeedback = $("rsvpFeedback");
const messageCount = $("messageCount");
const rsvpName = $("n");
const rsvpAttendance = $("h");
const rsvpMessage = $("p");
let savedRsvps = [];

const renderRsvps = () => {
  rsvpEntries.replaceChildren();

  if (savedRsvps.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.className = "rsvp-empty";
    emptyMessage.textContent = "Belum ada konfirmasi.";
    rsvpEntries.append(emptyMessage);
    return;
  }

  [...savedRsvps]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach(entry => {
      const card = document.createElement("article");
      card.className = "rsvp-entry";

      const header = document.createElement("div");
      header.className = "rsvp-entry-header";

      const identity = document.createElement("div");
      identity.className = "rsvp-entry-identity";

      const name = document.createElement("h4");
      name.textContent = entry.name;

      const status = document.createElement("span");
      status.className = `rsvp-status${entry.attendance === "Hadir" ? " is-attending" : ""}`;
      status.textContent = entry.attendance;

      const actions = document.createElement("div");
      actions.className = "rsvp-entry-actions";

      const deleteButton = document.createElement("button");
      deleteButton.className = "rsvp-delete";
      deleteButton.type = "button";
      deleteButton.textContent = "Hapus";
      deleteButton.setAttribute("aria-label", `Hapus konfirmasi ${entry.name}`);
      deleteButton.addEventListener("click", () => {
        if (!window.confirm(`Hapus konfirmasi dari ${entry.name}?`)) return;

        const nextRsvps = savedRsvps.filter(savedEntry => savedEntry.id !== entry.id);
        try {
          localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(nextRsvps));
          savedRsvps = nextRsvps;
          renderRsvps();
          rsvpFeedback.textContent = `Konfirmasi dari ${entry.name} berhasil dihapus.`;
        } catch (error) {
          rsvpFeedback.textContent = "Konfirmasi tidak dapat dihapus. Periksa ruang penyimpanan browser dan coba lagi.";
          console.error("Gagal menghapus konfirmasi dari penyimpanan lokal:", error);
        }
      });

      const time = document.createElement("time");
      time.className = "rsvp-time";
      time.dateTime = entry.createdAt;
      time.textContent = new Date(entry.createdAt).toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit"
      });

      identity.append(name, time);
      actions.append(status, deleteButton);
      header.append(identity, actions);
      card.append(header);

      if (entry.message) {
        const message = document.createElement("p");
        message.className = "rsvp-entry-message";
        message.textContent = entry.message;
        card.append(message);
      }

      rsvpEntries.append(card);
    });
};

try {
  const storedRsvps = JSON.parse(localStorage.getItem(RSVP_STORAGE_KEY) || "[]");
  if (!Array.isArray(storedRsvps)) throw new TypeError("Format daftar konfirmasi tidak valid.");
  const validRsvps = storedRsvps.filter(entry =>
    entry &&
    typeof entry.name === "string" &&
    typeof entry.message === "string" &&
    typeof entry.createdAt === "string" &&
    Number.isFinite(Date.parse(entry.createdAt)) &&
    ["Hadir", "Tidak hadir"].includes(entry.attendance)
  ).map(entry => ({
    ...entry,
    id: typeof entry.id === "string" ? entry.id : `${entry.createdAt}-${Math.random().toString(36).slice(2)}`
  }));
  if (validRsvps.length !== storedRsvps.length) {
    throw new TypeError("Ada data konfirmasi yang tidak valid.");
  }
  savedRsvps = validRsvps;
} catch (error) {
  rsvpFeedback.textContent = "Daftar konfirmasi tersimpan tidak dapat dibaca di perangkat ini. Data lama tidak dihapus.";
  console.error("Gagal membaca daftar konfirmasi dari penyimpanan lokal:", error);
}

renderRsvps();
messageCount.textContent = `${rsvpMessage.value.length}/500`;
rsvpMessage.addEventListener("input", () => {
  messageCount.textContent = `${rsvpMessage.value.length}/500`;
});

rsvpForm.addEventListener("submit", e => {
  e.preventDefault();

  if (!rsvpName.value.trim()) {
    rsvpFeedback.textContent = "Nama wajib diisi.";
    rsvpName.focus();
    return;
  }

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: rsvpName.value.trim(),
    attendance: rsvpAttendance.value,
    message: rsvpMessage.value.trim(),
    createdAt: new Date().toISOString()
  };
  const nextRsvps = [...savedRsvps, entry];

  try {
    localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(nextRsvps));
    savedRsvps = nextRsvps;
    renderRsvps();
    rsvpForm.reset();
    messageCount.textContent = "0/500";
    rsvpFeedback.textContent = "Konfirmasi berhasil disimpan di perangkat ini.";
  } catch (error) {
    rsvpFeedback.textContent = "Konfirmasi tidak dapat disimpan. Periksa ruang penyimpanan browser dan coba lagi.";
    console.error("Gagal menyimpan konfirmasi ke penyimpanan lokal:", error);
  }
});

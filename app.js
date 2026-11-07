// ---------- Fake data ----------

// Dates are set relative to today so the "Today" and "This week" filters always have results.
function daysFromNow(n) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

const genres = ["Indie rock", "Jazz", "Folk", "Metal", "Electronic", "Singer-songwriter", "Punk"];

const bands = {
  "Harmaat Lokit": {
    genre: "Indie rock",
    hometown: "Lahti",
    intro: "Four friends from Kiveriö playing jangly guitar songs about lakes, buses and bad weather. Their first EP came out last spring and they play around Päijät-Häme most months."
  },
  "Trio Kuura": {
    genre: "Jazz",
    hometown: "Heinola",
    intro: "Piano, double bass and drums. Trio Kuura plays mostly their own compositions with a few standards mixed in. Quiet, warm and good for a weeknight."
  },
  "Puolukka": {
    genre: "Folk",
    hometown: "Hollola",
    intro: "A folk duo with kantele, fiddle and two voices. They mix old Finnish songs with new ones they write themselves."
  },
  "Rautakoura": {
    genre: "Metal",
    hometown: "Lahti",
    intro: "Heavy, slow and loud. Rautakoura has been rehearsing in the same basement since 2019 and is finally recording a full album this winter."
  },
  "Neon Saimaa": {
    genre: "Electronic",
    hometown: "Lappeenranta",
    intro: "One-person live electronic set built from synths and field recordings. Expect long tracks and a dark room."
  },
  "Aino Lehto": {
    genre: "Singer-songwriter",
    hometown: "Orimattila",
    intro: "Aino writes small songs in Finnish and English with just an acoustic guitar. She has played in cafés across southern Finland and is working on her first record."
  },
  "Kolme Sekuntia": {
    genre: "Punk",
    hometown: "Lahti",
    intro: "Short, fast songs and no breaks between them. Kolme Sekuntia is a three-piece that plays anywhere with an outlet."
  }
};

let gigs = [
  {
    id: 1, band: "Harmaat Lokit", venue: "Kellari 12", address: "Aleksanterinkatu 12, Lahti",
    date: daysFromNow(0), time: "20:00", genre: "Indie rock", price: 8,
    description: "Release show for the new single, with support from a local school band.", link: "#"
  },
  {
    id: 2, band: "Trio Kuura", venue: "Kahvila Laituri", address: "Satamakatu 4, Lahti",
    date: daysFromNow(1), time: "19:00", genre: "Jazz", price: 0,
    description: "An evening jazz set by the harbour. Free entry, coffee and cake available.", link: "#"
  },
  {
    id: 3, band: "Puolukka", venue: "Kulttuuritila Ruuvi", address: "Vesijärvenkatu 30, Lahti",
    date: daysFromNow(3), time: "18:30", genre: "Folk", price: 5,
    description: "Small seated concert in a former workshop. Limited to 40 people.", link: "#"
  },
  {
    id: 4, band: "Rautakoura", venue: "Klubi Routa", address: "Rautatienkatu 18, Lahti",
    date: daysFromNow(5), time: "21:00", genre: "Metal", price: 12,
    description: "Two bands, one long night. Rautakoura headlines. Age limit 18.", link: "#"
  },
  {
    id: 5, band: "Neon Saimaa", venue: "Bar Vanha Paja", address: "Hämeenkatu 9, Lahti",
    date: daysFromNow(8), time: "22:00", genre: "Electronic", price: 10,
    description: "A two-hour live electronic set. Doors at 21:30.", link: "#"
  },
  {
    id: 6, band: "Aino Lehto", venue: "Kirjastokahvila Sivu", address: "Kirkkokatu 31, Lahti",
    date: daysFromNow(10), time: "17:00", genre: "Singer-songwriter", price: 0,
    description: "Acoustic afternoon show in the library café. Free entry.", link: "#"
  },
  {
    id: 7, band: "Kolme Sekuntia", venue: "Ravintola Kaarna", address: "Mariankatu 21, Lahti",
    date: daysFromNow(13), time: "20:30", genre: "Punk", price: 20,
    description: "Punk night with three bands from Lahti and Kouvola. Price includes a band T-shirt.", link: "#"
  }
];

// Gigs the logged-in organiser has published (ids from the list above)
let organiserGigIds = [3, 6];

// ---------- State ----------

const savedIds = [];
const reminders = {};
let currentGigId = null;
let playing = false;
let following = {};
let historyStack = [];
let currentScreen = "discover";
let nextId = 8;

// ---------- Helpers ----------

const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(d) {
  return dayNames[d.getDay()] + " " + d.getDate() + " " + monthNames[d.getMonth()];
}

function formatPrice(p) {
  if (p === 0) {
    return "Free";
  }
  return "€" + p;
}

function findGig(id) {
  return gigs.find(function (g) { return g.id === id; });
}

function isSaved(id) {
  return savedIds.indexOf(id) !== -1;
}

function gigRow(gig) {
  const li = document.createElement("li");
  li.innerHTML =
    '<div class="title"></div>' +
    '<div class="meta"></div>' +
    '<div class="meta"></div>';
  li.children[0].textContent = gig.band;
  li.children[1].textContent = gig.venue + " · " + formatDate(gig.date) + " " + gig.time;
  li.children[2].textContent = gig.genre + " · " + formatPrice(gig.price);
  li.addEventListener("click", function () {
    openGig(gig.id);
  });
  return li;
}

// ---------- Navigation ----------

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(function (s) {
    s.classList.add("hidden");
  });
  document.getElementById(id).classList.remove("hidden");
  currentScreen = id;
}

// Detail screens push onto a history stack so "Back" returns to where you came from
function goTo(id) {
  historyStack.push(currentScreen);
  showScreen(id);
}

function goBack() {
  const prev = historyStack.pop();
  if (prev === "gig") {
    renderGig();
  } else if (prev === "saved") {
    renderSaved();
  }
  if (prev) {
    showScreen(prev);
  } else {
    showScreen("discover");
  }
}

function switchTab(tab) {
  historyStack = [];
  document.querySelectorAll(".tabbar button").forEach(function (b) {
    if (b.dataset.tab === tab) {
      b.classList.add("active");
    } else {
      b.classList.remove("active");
    }
  });
  if (tab === "discover") {
    renderDiscover();
  } else if (tab === "saved") {
    renderSaved();
  } else {
    renderOrganiser();
  }
  showScreen(tab);
}

// ---------- Discover ----------

function renderDiscover() {
  const genre = document.getElementById("filter-genre").value;
  const date = document.getElementById("filter-date").value;
  const price = document.getElementById("filter-price").value;
  const today = daysFromNow(0).getTime();
  const weekEnd = daysFromNow(7).getTime();

  const list = document.getElementById("gig-list");
  list.innerHTML = "";

  const sorted = gigs.slice().sort(function (a, b) { return a.date - b.date; });
  const shown = sorted.filter(function (g) {
    if (genre !== "all" && g.genre !== genre) {
      return false;
    }
    if (date === "today" && g.date.getTime() !== today) {
      return false;
    }
    if (date === "week" && g.date.getTime() >= weekEnd) {
      return false;
    }
    if (price === "free" && g.price !== 0) {
      return false;
    }
    if (price === "under10" && g.price >= 10) {
      return false;
    }
    return true;
  });

  shown.forEach(function (g) {
    list.appendChild(gigRow(g));
  });

  if (shown.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "No gigs match these filters.";
    list.appendChild(li);
  }
}

// ---------- Gig details ----------

function openGig(id) {
  currentGigId = id;
  renderGig();
  goTo("gig");
}

function renderGig() {
  const gig = findGig(currentGigId);
  const box = document.getElementById("gig-content");
  let saveLabel = "Save gig";
  let saveClass = "btn secondary";
  if (isSaved(gig.id)) {
    saveLabel = "Saved ✓";
    saveClass = "btn";
  }

  box.innerHTML =
    '<div class="detail">' +
    '<h2><a href="#" id="band-link"></a></h2>' +
    '<dl>' +
    '<dt>Venue</dt><dd id="d-venue"></dd>' +
    '<dt>Date and time</dt><dd id="d-date"></dd>' +
    '<dt>Genre</dt><dd id="d-genre"></dd>' +
    '<dt>Price</dt><dd id="d-price"></dd>' +
    '</dl>' +
    '<p id="d-desc"></p>' +
    '<button id="save-btn" class="' + saveClass + '">' + saveLabel + '</button>' +
    '<button id="buy-btn" class="btn">Buy tickets</button>' +
    '<p class="small-text">Tickets are sold on the organiser\'s website.</p>' +
    '<p id="buy-msg" class="msg hidden">In the real app this would open the organiser\'s ticket page.</p>' +
    '</div>';

  document.getElementById("band-link").textContent = gig.band;
  document.getElementById("d-venue").textContent = gig.venue + ", " + gig.address;
  document.getElementById("d-date").textContent = formatDate(gig.date) + " at " + gig.time;
  document.getElementById("d-genre").textContent = gig.genre;
  document.getElementById("d-price").textContent = formatPrice(gig.price);
  document.getElementById("d-desc").textContent = gig.description;

  document.getElementById("band-link").addEventListener("click", function (e) {
    e.preventDefault();
    openBand(gig.band);
  });

  document.getElementById("save-btn").addEventListener("click", function () {
    if (isSaved(gig.id)) {
      savedIds.splice(savedIds.indexOf(gig.id), 1);
    } else {
      savedIds.push(gig.id);
    }
    renderGig();
  });

  document.getElementById("buy-btn").addEventListener("click", function () {
    document.getElementById("buy-msg").classList.remove("hidden");
  });
}

// ---------- Band profile ----------

function openBand(name) {
  playing = false;
  renderBand(name);
  goTo("band");
}

function renderBand(name) {
  const band = bands[name];
  const box = document.getElementById("band-content");
  let playLabel = "Play";
  if (playing) {
    playLabel = "Pause";
  }
  let followLabel = "Follow band";
  let followClass = "btn secondary";
  if (following[name]) {
    followLabel = "Following";
    followClass = "btn";
  }

  box.innerHTML =
    '<div class="detail">' +
    '<h2 id="b-name"></h2>' +
    '<dl>' +
    '<dt>Genre</dt><dd id="b-genre"></dd>' +
    '<dt>Hometown</dt><dd id="b-town"></dd>' +
    '</dl>' +
    '<p id="b-intro"></p>' +
    '<h3 class="section-title">Music sample</h3>' +
    '<div class="player">' +
    '<button id="play-btn" class="btn small">' + playLabel + '</button>' +
    '<div class="track"><span id="b-track"></span><div class="progress"><div></div></div></div>' +
    '</div>' +
    '<button id="follow-btn" class="' + followClass + '">' + followLabel + '</button>' +
    '<h3 class="section-title">Upcoming gigs</h3>' +
    '<ul id="band-gigs" class="list"></ul>' +
    '</div>';

  document.getElementById("b-name").textContent = name;
  document.getElementById("b-genre").textContent = band.genre;
  document.getElementById("b-town").textContent = band.hometown;
  document.getElementById("b-intro").textContent = band.intro;
  document.getElementById("b-track").textContent = name + " – Demo track";

  const list = document.getElementById("band-gigs");
  gigs.forEach(function (g) {
    if (g.band === name) {
      list.appendChild(gigRow(g));
    }
  });

  document.getElementById("play-btn").addEventListener("click", function () {
    playing = !playing;
    renderBand(name);
  });

  document.getElementById("follow-btn").addEventListener("click", function () {
    following[name] = !following[name];
    renderBand(name);
  });
}

// ---------- Saved ----------

function renderSaved() {
  const list = document.getElementById("saved-list");
  list.innerHTML = "";

  if (savedIds.length === 0) {
    document.getElementById("saved-empty").classList.remove("hidden");
  } else {
    document.getElementById("saved-empty").classList.add("hidden");
  }

  savedIds.forEach(function (id) {
    const gig = findGig(id);
    const li = gigRow(gig);

    // Wrap the row text and add a reminder switch on the right
    const wrap = document.createElement("div");
    wrap.className = "row-flex";
    const text = document.createElement("div");
    while (li.firstChild) {
      text.appendChild(li.firstChild);
    }
    const sw = document.createElement("button");
    sw.className = "switch";
    if (reminders[id]) {
      sw.classList.add("on");
    }
    sw.innerHTML = 'Reminder <span class="track-ui"></span>';
    sw.addEventListener("click", function (e) {
      e.stopPropagation(); // don't open the gig
      reminders[id] = !reminders[id];
      sw.classList.toggle("on");
    });

    wrap.appendChild(text);
    wrap.appendChild(sw);
    li.appendChild(wrap);
    list.appendChild(li);
  });
}

// ---------- Organiser ----------

function renderOrganiser() {
  const list = document.getElementById("org-list");
  list.innerHTML = "";
  organiserGigIds.forEach(function (id) {
    const gig = findGig(id);
    const li = document.createElement("li");
    li.innerHTML =
      '<div class="row-flex">' +
      '<div><div class="title"></div><div class="meta"></div></div>' +
      '<button class="btn small secondary">Edit</button>' +
      '</div>';
    li.querySelector(".title").textContent = gig.band;
    li.querySelector(".meta").textContent = gig.venue + " · " + formatDate(gig.date) + " " + gig.time;
    li.style.cursor = "default";
    list.appendChild(li);
  });
}

function publishGig(e) {
  e.preventDefault();
  const f = e.target;
  const name = f.band.value.trim();
  const parts = f.date.value.split("-");
  const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

  let description = f.description.value.trim();
  if (description === "") {
    description = "No description added.";
  }

  // New bands get a basic profile so the band link still works
  if (!bands[name]) {
    bands[name] = {
      genre: f.genre.value,
      hometown: "Lahti",
      intro: "This band has not added a profile text yet."
    };
  }

  gigs.push({
    id: nextId, band: name, venue: f.venue.value.trim(), address: "Lahti",
    date: date, time: f.time.value, genre: f.genre.value, price: Number(f.price.value),
    description: description, link: f.link.value || "#"
  });
  organiserGigIds.push(nextId);
  nextId = nextId + 1;

  f.reset();
  document.getElementById("publish-msg").classList.remove("hidden");
  renderOrganiser();
  renderDiscover();
}

// ---------- Setup ----------

function fillGenreSelects() {
  const filter = document.getElementById("filter-genre");
  const form = document.getElementById("form-genre");
  genres.forEach(function (g) {
    filter.appendChild(new Option(g, g));
    form.appendChild(new Option(g, g));
  });
}

fillGenreSelects();
renderDiscover();

document.querySelectorAll(".filters select").forEach(function (s) {
  s.addEventListener("change", renderDiscover);
});

document.querySelectorAll(".back").forEach(function (a) {
  a.addEventListener("click", function (e) {
    e.preventDefault();
    goBack();
  });
});

document.querySelectorAll(".tabbar button").forEach(function (b) {
  b.addEventListener("click", function () {
    switchTab(b.dataset.tab);
  });
});

document.getElementById("publish-form").addEventListener("submit", publishGig);

document.getElementById("publish-form").addEventListener("input", function () {
  document.getElementById("publish-msg").classList.add("hidden");
});

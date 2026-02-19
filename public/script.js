const clipboardsContainer = document.getElementById("clipboardsContainer");
const addBtn = document.getElementById("addBtn");
const manageTagsBtn = document.getElementById("manageTagsBtn");
const filterTagsDiv = document.getElementById("drawerFilterTags");

const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const sortBySelect = document.getElementById("sortBy");
const searchInput = document.getElementById("searchInput");
const clearSearch = document.getElementById("clearSearch");
const clearAllBtn = document.getElementById("clearAllBtn");
const tagsModalOverlay = document.getElementById("tagsModalOverlay");
const closeTagsModalBtn = document.getElementById("closeTagsModalBtn");
const tagsModalTitle = document.getElementById("tagsModalTitle");
const tagsModalName = document.getElementById("tagsModalName");
const tagsModalColor = document.getElementById("tagsModalColor");
const tagsModalDeleteBtn = document.getElementById("tagsModalDeleteBtn");
const tagsModalSaveBtn = document.getElementById("tagsModalSaveBtn");

let filterTagIds = [];
let selectedFilterTags = [];
let allTagsCache = []; // store all tags
let editingTagId = null;

function formatClipboardDate(value) {
  if (!value) return "New";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "New";
  return new Intl.DateTimeFormat("en-US", {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

async function getTags() {
  if (allTagsCache.length) return allTagsCache;

  const res = await fetch("/api/tags");
  const data = await res.json();

  allTagsCache = data;
  return data;
}

async function loadFilterTags() {
  const tags = await getTags();
  filterTagsDiv.innerHTML = "";

  tags.forEach((tag) => {
    const row = document.createElement("div");
    row.className = "drawer-tag-row";

    const wrapper = document.createElement("label");
    wrapper.className = "drawer-tag-label";

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.value = tag._id;
    cb.checked = filterTagIds.includes(tag._id);

    cb.onchange = () => {
      if (cb.checked) {
        filterTagIds.push(tag._id);
        selectedFilterTags.push(tag);
      } else {
        filterTagIds = filterTagIds.filter((id) => id !== tag._id);
        selectedFilterTags = selectedFilterTags.filter(
          (t) => t._id !== tag._id,
        );
      }

      renderActiveTags();
      applyFilters();
    };

    const pill = document.createElement("span");
    pill.textContent = tag.name;
    pill.className = "tag";
    pill.style.background = tag.color;

    wrapper.append(cb, pill);

    const editBtn = document.createElement("button");
    editBtn.className = "border-btn drawer-tag-edit-btn";
    editBtn.title = "Edit tag";
    editBtn.setAttribute("aria-label", `Edit ${tag.name}`);
    editBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z"/>
      </svg>
    `;
    editBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      openTagsModal(tag);
    };

    row.append(wrapper, editBtn);
    filterTagsDiv.appendChild(row);
  });
}

async function applyFilters() {
  const payload = {
    tagIds: filterTagIds,
    startDate: startDateInput.value || undefined,
    endDate: endDateInput.value || undefined,
    sortBy: sortBySelect.value,
  };
  const res = await fetch("/api/filter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  clipboardsContainer.innerHTML = "";
  data.forEach((c) => {
    const wrapper = createClipboard(
      c.title || "",
      c.text || "",
      c._id,
      c.createdAt,
      c.tags || [],
    );
    clipboardsContainer.append(wrapper);
  });
}

function createClipboard(
  title = "",
  text = "",
  id = null,
  createdAt = null,
  tags = [],
) {
  text = sanitizeClipboardText(text);
  const wrapper = document.createElement("div");
  wrapper.className = "clipboard clipboard-card";
  if (!id) {
    wrapper.classList.add("new-clipboard");
  }

  // --- TITLE INPUT ---
  const titleInput = document.createElement("input");
  titleInput.type = "text";
  titleInput.readOnly = true;
  titleInput.tabIndex = -1; // ❌ no keyboard focus
  titleInput.style.pointerEvents = "none"; // ❌ no mouse focus

  titleInput.className = "editable-title";
  titleInput.placeholder = "Title (optional)";
  titleInput.value = title;
  titleInput.style.fontWeight = "bold";
  titleInput.style.width = "100%";
  titleInput.style.marginBottom = "0";
  titleInput.style.padding = "6px 10px";
  titleInput.style.borderRadius = "6px";
  titleInput.style.border = "1px solid #ccc";

  titleInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      editable.focus();
    }
  });

  // --- MESSAGE VIEW (READ ONLY) ---
  const viewTitle = document.createElement("div");
  viewTitle.className = "clipboard-title";

  const messageDiv = document.createElement("div");
  messageDiv.className = "message-view";

  function renderViewContent(currentTitle, currentText) {
    const cleanTitle = (currentTitle || "").trim();
    const cleanText = sanitizeClipboardText(currentText || "");
    viewTitle.textContent = cleanTitle;
    viewTitle.style.display = cleanTitle ? "block" : "none";
    messageDiv.innerHTML = nl2br(cleanText);
  }

  renderViewContent(title, text);

  // --- EDITABLE MESSAGE ---
  const editable = document.createElement("div");
  editable.className = "editable";
  editable.contentEditable = false;
  editable.textContent = text;

  editable.className = "editable";
  editable.contentEditable = false; // 🔒 locked initially

  editable.textContent = text;
  editable.addEventListener("paste", (e) => {
    // Keep pasted content plain text (no hidden href from rich links).
    e.preventDefault();
    const plainText = (e.clipboardData || window.clipboardData).getData(
      "text/plain",
    );
    if (document.queryCommandSupported("insertText")) {
      document.execCommand("insertText", false, plainText);
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(plainText));
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  });

  // --- TAGS CONTAINER ---
  const tagsContainer = document.createElement("div");
  tagsContainer.className = "clipboard-tags";
  tagsContainer.style.marginTop = "6px";
  tagsContainer.style.display = "flex";
  tagsContainer.style.flexWrap = "wrap";

  (tags || []).forEach((tag) => {
    const tagEl = document.createElement("span");
    tagEl.textContent = tag.name;
    tagEl.className = "tag";
    tagEl.style.background = tag.color;
    tagEl.style.marginRight = "5px";
    tagsContainer.appendChild(tagEl);
  });

  let selectedTagIds = (tags || []).map((t) => t._id);

  function renderNewTags() {
    tagsContainer.innerHTML = "";

    selectedTagIds.forEach((tagId) => {
      const tag = allTagsCache.find((t) => t._id === tagId);
      if (!tag) return;

      const tagEl = document.createElement("span");
      tagEl.textContent = tag.name;
      tagEl.className = "tag";
      tagEl.style.background = tag.color;
      tagEl.style.marginRight = "5px";

      tagsContainer.appendChild(tagEl);
    });
  }

  const addTagBtn = document.createElement("button");
  addTagBtn.className = "border-btn clipboard-add-tag-btn";
  addTagBtn.title = "Add Tag";

  addTagBtn.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#2196f3"><path d="M856-390 570-104q-12 12-27 18t-30 6q-15 0-30-6t-27-18L103-457q-11-11-17-25.5T80-513v-287q0-33 23.5-56.5T160-880h287q16 0 31 6.5t26 17.5l352 353q12 12 17.5 27t5.5 30q0 15-5.5 29.5T856-390ZM513-160l286-286-353-354H160v286l353 354ZM260-640q25 0 42.5-17.5T320-700q0-25-17.5-42.5T260-760q-25 0-42.5 17.5T200-700q0 25 17.5 42.5T260-640Zm220 160Z"/></svg>
 
 `;

  const tagPickerDiv = document.createElement("div");
  tagPickerDiv.className = "clipboard-tags-picker";

  tagPickerDiv.style.display = "none";
  tagPickerDiv.style.pointerEvents = "none"; // 🔒 disable tag editing
  tagPickerDiv.style.opacity = "0.6";

  tagPickerDiv.style.flexWrap = "wrap";
  tagPickerDiv.style.gap = "8px";
  tagPickerDiv.style.marginTop = "6px";

  async function loadTagPicker() {
    const allTags = await getTags();
    tagPickerDiv.innerHTML = "";

    allTags.forEach((tag) => {
      const label = document.createElement("label");
      label.style.display = "inline-flex";
      label.style.alignItems = "center";
      label.style.gap = "4px";
      label.style.cursor = "pointer";

      // Checkbox
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = tag._id;
      checkbox.style.margin = "0";

      // Checked if already selected
      if (selectedTagIds.includes(tag._id)) {
        checkbox.checked = true;
      }

      // Tag pill
      const pill = document.createElement("span");
      pill.textContent = tag.name;
      pill.className = "tag";
      pill.style.background = tag.color;
      pill.style.padding = "3px 8px";
      pill.style.borderRadius = "10px";
      pill.style.fontSize = "12px";

      // When toggled
      checkbox.onchange = () => {
        if (checkbox.checked) {
          if (!selectedTagIds.includes(tag._id)) {
            selectedTagIds.push(tag._id);
          }
        } else {
          selectedTagIds = selectedTagIds.filter((id) => id !== tag._id);
        }

        renderNewTags();

        // ✅ Switch Copy → Save when tags change
        updateSaveCopyButton(true);
      };

      label.append(checkbox, pill);
      tagPickerDiv.appendChild(label);
    });
  }

  function syncTagCheckboxes() {
    tagPickerDiv.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.checked = selectedTagIds.includes(cb.value);
    });
  }

  addTagBtn.onclick = async () => {
    if (!isEditMode) return; // 🔒 Only allow editing in edit mode

    if (tagPickerDiv.style.display === "none") {
      if (!tagPickerDiv.children.length) {
        await loadTagPicker();
      }

      syncTagCheckboxes();
      tagPickerDiv.style.display = "flex";

      // ✅ Editing started
      updateSaveCopyButton(true);
    } else {
      tagPickerDiv.style.display = "none";
    }
  };

  const saveCopyBtn = document.createElement("button");
  let isSaveMode = false; // ✅ track state properly

  saveCopyBtn.className = "border-btn clipboard-icon-btn clipboard-copy-btn";

  saveCopyBtn.addEventListener("mousedown", (e) => {
    e.preventDefault(); // prevent blur before save
  });

  saveCopyBtn.onclick = async (e) => {
    e.stopPropagation(); // prevent blur conflicts

    const content = getClipboardCopyText(editable, messageDiv);

    const titleText = titleInput.value.trim();
    if (!content.replace(/\s/g, "") && !titleText) return;

    // NEW clipboard → SAVE
    if (!id) {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleText,
          text: content,
          tagIds: selectedTagIds,
        }),
      });
      const saved = await res.json();
      id = saved._id;

      // ✅ Update messageDiv immediately
      renderViewContent(titleText, content);

      renderActionButton();
      disableEditMode();
      syncTagCheckboxes();
      return;
    }

    // EXISTING clipboard → UPDATE
    // EXISTING clipboard → UPDATE
    if (isSaveMode) {
      await fetch(`/api/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleText,
          text: content,
          tagIds: selectedTagIds,
        }),
      });

      renderViewContent(titleText, content);

      disableEditMode();
    } else {
      const copied = await copyTextToClipboard(content);
      if (!copied) {
        alert("Copy failed. Please allow clipboard permission and try again.");
        return;
      }
      alert("Copied to clipboard!");
    }
  };

  function updateSaveCopyButton(isEditing = false) {
    const saveIcon = `
 <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Zm-40-86v446-560 114Z"/></svg>
  `;

    const copyIcon = `
   <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 -960 960 960" width="20" fill="currentColor"><path d="M760-200H320q-33 0-56.5-23.5T240-280v-560q0-33 23.5-56.5T320-920h280l240 240v400q0 33-23.5 56.5T760-200ZM560-640v-200H320v560h440v-360H560ZM160-40q-33 0-56.5-23.5T80-120v-560h80v560h440v80H160Zm160-800v200-200 560-560Z"/></svg>
  `;

    // ✅ If in edit mode → ALWAYS Save
    if (isEditMode) {
      isSaveMode = true;
      saveCopyBtn.innerHTML = saveIcon;
      saveCopyBtn.title = "Save";
      return;
    }

    // ✅ If new clipboard → Save
    if (!id) {
      isSaveMode = true;
      saveCopyBtn.innerHTML = saveIcon;
      saveCopyBtn.title = "Save";
      return;
    }

    // ✅ Normal view mode → Copy
    isSaveMode = false;
    saveCopyBtn.innerHTML = copyIcon;
    saveCopyBtn.title = "Copy";
  }

  const actionBtn = document.createElement("button");
  actionBtn.className = "delete-btn clipboard-icon-btn clipboard-delete-btn";
  actionBtn.title = "Delete"; // tooltip
  actionBtn.style.display = "none"; // ✅ hide by default

  function renderActionButton() {
    if (!id) {
      actionBtn.innerHTML = `
      <span style="display:flex;align-items:center;gap:6px;">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
          <path d="M19,6.41 17.59,5 12,10.59 6.41,5 5,6.41 10.59,12 5,17.59 6.41,19 12,13.41 17.59,19 19,17.59 13.41,12Z"/>
        </svg>
      </span>
    `;
      actionBtn.onclick = () => wrapper.remove();
    } else {
      actionBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
        <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M9,8H11V17H9V8M13,8H15V17H13V8Z"></path>
      </svg>
    `;
      actionBtn.onclick = async () => {
        if (confirm("Are you sure you want to delete this clipboard?")) {
          await fetch(`/api/delete/${id}`, { method: "DELETE" });
          wrapper.remove();
        }
      };
    }
  }

  // When editing text
  editable.addEventListener("focus", () => updateSaveCopyButton(true));
  editable.addEventListener("blur", () => {
    if (!isEditMode) updateSaveCopyButton(false);
  });

  // ✅ When editing title
  titleInput.addEventListener("focus", () => updateSaveCopyButton(true));
  titleInput.addEventListener("blur", () => {
    if (!isEditMode) updateSaveCopyButton(false);
  });

  const time = document.createElement("div");

  let isEditMode = false;
  let isNewClipboard = !id; // ✅ true if newly created
  // --- EDIT BUTTON ---
  const editBtn = document.createElement("button");
  editBtn.className = "border-btn clipboard-icon-btn clipboard-edit-btn";
  editBtn.title = "Edit";
  const editIcon = `
<svg xmlns="http://www.w3.org/2000/svg" height="18" viewBox="0 0 24 24" width="18" fill="currentColor">
<path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 
7.04a1.003 1.003 0 000-1.42l-2.34-2.34a1.003 
1.003 0 00-1.42 0l-1.83 1.83 3.75 
3.75 1.84-1.82z"/>
</svg>
`;

  const closeIcon = `
<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
<path d="M19,6.41 17.59,5 12,10.59 6.41,5 5,6.41 10.59,12 5,17.59 
6.41,19 12,13.41 17.59,19 19,17.59 13.41,12Z"/>
</svg>
`;

  editBtn.innerHTML = editIcon;
  // ✅ Hide edit button for new clipboard
  if (isNewClipboard) {
    editBtn.style.display = "none";
  }

  editBtn.onclick = () => {
    if (!isEditMode) {
      enableEditMode();
    } else {
      disableEditMode();
    }
  };

  async function enableEditMode() {
    topBar.classList.add("is-editing");
    addTagBtn.style.display = "inline-flex"; // show add tag button in edit mode

    isEditMode = true;

    // ✅ Show close only if NOT new
    if (!isNewClipboard) {
      editBtn.innerHTML = closeIcon;
      editBtn.title = "Close";
      editBtn.classList.add("edit-close-mode");
    }

    titleInput.readOnly = false;
    titleInput.tabIndex = 0;
    titleInput.style.pointerEvents = "auto";

    editable.contentEditable = "plaintext-only";

    tagPickerDiv.style.pointerEvents = "auto";
    tagPickerDiv.style.opacity = "1";
    tagPickerDiv.style.display = "flex";
    tagPickerDiv.style.height = "auto";
    tagPickerDiv.style.marginTop = "6px";
    tagPickerDiv.style.padding = "2px";

    if (!tagPickerDiv.children.length) {
      await loadTagPicker();
    }

    syncTagCheckboxes();

    titleInput.classList.add("editing");
    editable.classList.add("editing");

    // Show inputs
    titleInput.style.display = "block";
    editable.style.display = "block";
    messageDiv.style.display = "none"; // hide view-only text
    viewTitle.style.display = "none";

    editable.focus();

    // ✅ Show delete button
    actionBtn.style.display = "inline-flex";

    updateSaveCopyButton(true);
  }

  function disableEditMode() {
    topBar.classList.remove("is-editing");
    // ✅ After first save, it's no longer new
    isNewClipboard = false;
    wrapper.classList.remove("new-clipboard");

    // ✅ Show edit button after first save
    editBtn.style.display = "inline-flex";

    addTagBtn.style.display = "none";

    isEditMode = false;

    // 🔥 RESET SAVE MODE
    isSaveMode = false;

    editBtn.innerHTML = editIcon;
    editBtn.title = "Edit";
    editBtn.classList.remove("edit-close-mode");

    titleInput.readOnly = true;
    editable.contentEditable = false;

    tagPickerDiv.style.pointerEvents = "none";
    tagPickerDiv.style.opacity = "0.6";
    tagPickerDiv.style.display = "none";
    tagPickerDiv.style.height = "0";
    tagPickerDiv.style.margin = "0";
    tagPickerDiv.style.padding = "0";

    titleInput.classList.remove("editing");
    editable.classList.remove("editing");

    // Hide inputs
    titleInput.style.display = "none";
    editable.style.display = "none";

    // Show view mode
    messageDiv.style.display = "block";

    // Hide delete button
    actionBtn.style.display = "none";

    // ✅ Get correct text
    const titleText = titleInput.value.trim();
    const bodyText = getEditableText(editable);

    // ✅ Update view
    renderViewContent(titleText, bodyText);

    // 🔥 FORCE COPY MODE
    updateSaveCopyButton(false);
  }

  time.className = "message clipboard-time";
  time.textContent = formatClipboardDate(createdAt);

  const topBar = document.createElement("div");
  topBar.className = "clipboard-topbar";
  const topBarTitle = document.createElement("div");
  topBarTitle.className = "clipboard-topbar-title";
  topBarTitle.append(viewTitle, titleInput);
  saveCopyBtn.style.marginLeft = "auto";
  topBar.append(topBarTitle, saveCopyBtn);

  const footerLeft = document.createElement("div");
  footerLeft.className = "clipboard-footer-left";
  footerLeft.append(editBtn, addTagBtn, actionBtn);

  renderActionButton();

  const footerDiv = document.createElement("div");
  footerDiv.className = "clipboard-footer";

  footerDiv.append(footerLeft, time);

  wrapper.append(
    topBar,
    messageDiv,
    editable,
    tagsContainer,
    tagPickerDiv,
    footerDiv,
  );

  // --- SHOW/HIDE Add Tag BUTTON BASED ON EDIT MODE ---
  if (isEditMode) {
    addTagBtn.style.display = "inline-flex";
  } else {
    addTagBtn.style.display = "none";
  }

  // --- INITIAL DISPLAY BASED ON EDIT MODE ---
  if (isEditMode) {
    titleInput.style.display = "block";
    editable.style.display = "block";
    messageDiv.style.display = "none";
    actionBtn.style.display = "inline-flex"; // show delete in edit mode
  } else {
    titleInput.style.display = "none";
    editable.style.display = "none";
    messageDiv.style.display = "block";
    actionBtn.style.display = "none"; // hide delete in view mode
  }

  updateSaveCopyButton(false);

  return wrapper;
}

async function fetchHistory() {
  const payload = {
    tagIds: [],
    sortBy: sortBySelect.value,
  };

  const res = await fetch("/api/filter", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  clipboardsContainer.innerHTML = "";
  data.forEach((c) => {
    const wrapper = createClipboard(
      c.title || "", // title
      c.text || "", // text
      c._id, // id
      c.createdAt, // createdAt
      c.tags || [], // tags
    );
    clipboardsContainer.append(wrapper);
  });
}

addBtn.onclick = () => {
  const wrapper = createClipboard(); // view mode created
  clipboardsContainer.prepend(wrapper);

  // Enable edit mode immediately for new clipboard
  const editBtn = wrapper.querySelector(".border-btn[title='Edit']");
  editBtn.click(); // triggers enableEditMode()
};

loadFilterTags();
fetchHistory();

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  clearSearch.style.display = query ? "block" : "none";

  clipboardsContainer.querySelectorAll(".clipboard").forEach((div) => {
    const editableDiv = div.querySelector(".editable");
    const titleInput = div.querySelector(".editable-title"); // ✅ get the title input

    const text = editableDiv.innerText.toLowerCase();
    const titleText = titleInput.value.toLowerCase(); // ✅ title text
    let tagMatch = false;

    editableDiv.querySelectorAll("span.tag").forEach((tag) => {
      if (tag.textContent.toLowerCase().includes(query)) tagMatch = true;
    });

    // Show if title OR text OR tags match the query
    div.style.display =
      text.includes(query) || titleText.includes(query) || tagMatch
        ? ""
        : "none";
  });
});

clearSearch.onclick = () => {
  searchInput.value = "";
  clearSearch.style.display = "none";
  clipboardsContainer
    .querySelectorAll(".clipboard")
    .forEach((div) => (div.style.display = ""));
};

startDateInput.addEventListener("change", applyFilters);
endDateInput.addEventListener("change", applyFilters);
sortBySelect.addEventListener("change", applyFilters);

clearAllBtn.onclick = async () => {
  searchInput.value = "";
  clearSearch.style.display = "none";
  filterTagIds = [];
  selectedFilterTags = [];
  document
    .querySelectorAll("#drawerFilterTags input")
    .forEach((cb) => (cb.checked = false));
  startDateInput.value = "";
  endDateInput.value = "";
  sortBySelect.value = "date_desc";
  document.getElementById("activeTagFilters").innerHTML = "";
  await fetchHistory();
  toggleDrawer();
};

function toggleDrawer() {
  document.getElementById("drawer").classList.toggle("open");
  document.body.classList.toggle("drawer-open");
}

function goHome() {
  window.location.href = "/";
}

function goTags() {
  openTagsModal();
}

function openTagsModal(tag = null) {
  if (!tagsModalOverlay) return;
  editingTagId = tag?._id || null;
  tagsModalOverlay.classList.toggle("editing-tag", Boolean(editingTagId));
  if (tagsModalTitle) {
    tagsModalTitle.textContent = editingTagId ? "Edit Tag" : "Tags";
    tagsModalTitle.classList.toggle("is-edit-title", Boolean(editingTagId));
  }
  if (tagsModalName) {
    tagsModalName.value = tag?.name || "";
  }
  if (tagsModalColor) {
    tagsModalColor.value = tag?.color || "#00c853";
  }
  tagsModalOverlay.classList.add("open");
  tagsModalOverlay.setAttribute("aria-hidden", "false");
  if (tagsModalName) tagsModalName.focus();
}

function closeTagsModal() {
  if (!tagsModalOverlay) return;
  editingTagId = null;
  tagsModalOverlay.classList.remove("editing-tag");
  tagsModalOverlay.classList.remove("open");
  tagsModalOverlay.setAttribute("aria-hidden", "true");
}

async function saveTagFromModal() {
  const name = (tagsModalName?.value || "").trim();
  const color = tagsModalColor?.value || "#00c853";
  if (!name) return;

  const endpoint = editingTagId ? `/api/tags/${editingTagId}` : "/api/tags";
  const method = editingTagId ? "PUT" : "POST";
  const res = await fetch(endpoint, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color }),
  });

  if (!res.ok) return;

  if (tagsModalName) tagsModalName.value = "";
  allTagsCache = [];
  await loadFilterTags();
  if (selectedFilterTags.length) {
    selectedFilterTags = selectedFilterTags
      .map((t) => allTagsCache.find((fresh) => fresh._id === t._id))
      .filter(Boolean);
    renderActiveTags();
  }
  applyFilters();
  closeTagsModal();
}

async function deleteTagFromModal() {
  if (!editingTagId) return;

  const res = await fetch(`/api/tags/${editingTagId}`, { method: "DELETE" });
  if (!res.ok) return;

  filterTagIds = filterTagIds.filter((id) => id !== editingTagId);
  selectedFilterTags = selectedFilterTags.filter((t) => t._id !== editingTagId);

  allTagsCache = [];
  await loadFilterTags();
  renderActiveTags();
  applyFilters();
  closeTagsModal();
}

if (closeTagsModalBtn) {
  closeTagsModalBtn.addEventListener("click", closeTagsModal);
}

if (tagsModalOverlay) {
  tagsModalOverlay.addEventListener("click", (e) => {
    if (e.target === tagsModalOverlay) closeTagsModal();
  });
}

if (tagsModalSaveBtn) {
  tagsModalSaveBtn.addEventListener("click", saveTagFromModal);
}

if (tagsModalDeleteBtn) {
  tagsModalDeleteBtn.addEventListener("click", deleteTagFromModal);
}

if (tagsModalName) {
  tagsModalName.addEventListener("keydown", (e) => {
    if (e.key === "Enter") saveTagFromModal();
    if (e.key === "Escape") closeTagsModal();
  });
}

window.openTagsModal = openTagsModal;

function renderActiveTags() {
  const container = document.getElementById("activeTagFilters");
  container.innerHTML = "";

  selectedFilterTags.forEach((tag) => {
    const pill = document.createElement("div");
    pill.className = "active-tag";
    pill.style.background = tag.color;

    const name = document.createElement("span");
    name.textContent = tag.name;

    const remove = document.createElement("span");
    remove.textContent = "✖";

    remove.onclick = () => {
      // Remove from state
      filterTagIds = filterTagIds.filter((id) => id !== tag._id);
      selectedFilterTags = selectedFilterTags.filter((t) => t._id !== tag._id);

      // Uncheck drawer checkbox
      document.querySelectorAll("#drawerFilterTags input").forEach((cb) => {
        if (cb.value === tag._id) cb.checked = false;
      });

      // Re-render active tags
      renderActiveTags();

      // 🔥 APPLY FILTERS AGAIN to update view
      applyFilters();
    };

    pill.append(name, remove);
    container.appendChild(pill);
  });
}

function nl2br(str) {
  if (!str) return "";

  return str
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((line) => (line === "" ? "&nbsp;" : line))
    .join("<br>");
}

// const content = getEditableText(editable); // instead of editable.innerText

function getEditableText(el) {
  if (!el) return "";

  let html = el.innerHTML;

  // Convert block tags to line breaks
  html = html.replace(/<div><br><\/div>/gi, "\n\n");
  html = html.replace(/<div>/gi, "\n");
  html = html.replace(/<\/div>/gi, "");
  html = html.replace(/<p>/gi, "\n");
  html = html.replace(/<\/p>/gi, "");
  html = html.replace(/<br\s*\/?>/gi, "\n");

  // Remove nbsp
  html = html.replace(/&nbsp;/g, " ");

  // Strip remaining tags (for example <a href="...">text</a>) and keep visible text.
  const temp = document.createElement("div");
  temp.innerHTML = html;
  const text = (temp.textContent || "").replace(/\u00A0/g, " ");

  // Preserve vertical spacing
  return sanitizeClipboardText(
    text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trimEnd(),
  );
}

function getClipboardCopyText(editableEl, viewEl) {
  const editableText = getEditableText(editableEl);
  if (editableText && editableText.trim()) return editableText;
  return sanitizeClipboardText((viewEl?.innerText || "").trim());
}

async function copyTextToClipboard(text) {
  const value = String(text || "");
  if (!value) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (_) {
    // Fallback below when Clipboard API is blocked/unavailable.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (ok) return true;
  } catch (_) {
    // Try final fallback below.
  }

  try {
    const onCopy = (e) => {
      e.preventDefault();
      e.clipboardData.setData("text/plain", value);
    };
    document.addEventListener("copy", onCopy, { once: true });
    const ok = document.execCommand("copy");
    document.removeEventListener("copy", onCopy);
    return ok;
  } catch (_) {
    return false;
  }
}

function sanitizeClipboardText(str) {
  if (!str) return "";
  let text = String(str).replace(/\u00A0/g, " ");

  // If any HTML-like markup is present, convert it to visible plain text.
  if (/[<>]/.test(text)) {
    const htmlish = text
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<div[^>]*>/gi, "")
      .replace(/<p[^>]*>/gi, "");

    const temp = document.createElement("div");
    temp.innerHTML = htmlish;
    text = temp.textContent || "";
  }

  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}




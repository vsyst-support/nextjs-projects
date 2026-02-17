// ===== Color preview for "Create Tag" form =====
const colorInput = document.getElementById("color");
const colorPreview = document.getElementById("colorPreview");

// Update preview when the color picker changes
colorInput.addEventListener("input", () => {
  colorPreview.style.background = colorInput.value;
});

async function saveTag() {
  const name = document.getElementById("name").value.trim();
  const color = colorInput.value;
  if (!name) return;

  await fetch("/api/tags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, color }),
  });

  document.getElementById("name").value = "";
  loadTags();
}

async function loadTags() {
  const res = await fetch("/api/tags");
  const tags = await res.json();
  const list = document.getElementById("tagList");

  list.innerHTML = "";

  tags.forEach((tag) => {
    const row = document.createElement("div");
    row.className = "tag-row";

    const left = document.createElement("div");
    left.className = "tag-left";

    const pill = document.createElement("span");
    pill.className = "tag-pill";
    pill.style.background = tag.color;
    pill.textContent = tag.name;

    left.appendChild(pill);

    const actions = document.createElement("div");
    actions.className = "tag-actions";

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.innerHTML = `
  <span style="display:flex;align-items:center;gap:6px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#2196f3">
      <path d="M3,17.25V21H6.75L17.81,9.94L14.06,6.19L3,17.25M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.13,5.12L18.88,8.87L20.71,7.04Z"/>
    </svg>
  </span>
`;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = `
  <span style="display:flex;align-items:center;gap:6px;">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#f44336">
      <path d="M9,3V4H4V6H5V19A2,2 0 0,0 7,21H17A2,2 0 0,0 19,19V6H20V4H15V3H9M9,8H11V17H9V8M13,8H15V17H13V8Z"/>
    </svg>
  </span>
`;

    editBtn.onclick = () => startEdit(tag, row);
    deleteBtn.onclick = async () => {
      if (!confirm("Delete this tag?")) return;
      await fetch(`/api/tags/${tag._id}`, { method: "DELETE" });
      loadTags();
    };

    actions.append(editBtn, deleteBtn);
    row.append(left, actions);
    list.appendChild(row);
  });
}

function startEdit(tag, row) {
  row.innerHTML = "";

  // Name input
  const nameInput = document.createElement("input");
  nameInput.value = tag.name;
  nameInput.className = "edit-input";

  // Color input
  const colorInputEl = document.createElement("input");
  colorInputEl.type = "color";
  colorInputEl.value = tag.color;

  // Color preview for edit
  const colorPreviewEl = document.createElement("span");
  colorPreviewEl.style.display = "inline-block";
  colorPreviewEl.style.width = "20px";
  colorPreviewEl.style.height = "20px";
  colorPreviewEl.style.borderRadius = "4px";
  colorPreviewEl.style.border = "1px solid #ccc";
  colorPreviewEl.style.marginLeft = "6px";
  colorPreviewEl.style.verticalAlign = "middle";
  colorPreviewEl.style.background = tag.color;

  // Update preview dynamically
  colorInputEl.addEventListener("input", () => {
    colorPreviewEl.style.background = colorInputEl.value;
  });

  // Save button
  const saveBtn = document.createElement("button");
  saveBtn.className = "save-edit-btn";
  saveBtn.innerHTML = "Save";

  saveBtn.onclick = async () => {
    await fetch(`/api/tags/${tag._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nameInput.value.trim(),
        color: colorInputEl.value,
      }),
    });
    loadTags();
  };

  // Append to row
  row.append(nameInput, colorInputEl, colorPreviewEl, saveBtn);
}

loadTags();

window.saveTag = saveTag;

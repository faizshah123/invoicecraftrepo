const STORAGE_KEY = "invoicecraft.saved.v1";

const currencyEl = document.getElementById("inv-currency");
const itemsBody = document.getElementById("items-body");
const viewItemsBody = document.getElementById("view-items-body");
const isGenerator = Boolean(itemsBody && currencyEl);

function money(value) {
  const symbol = (currencyEl && currencyEl.value) || "$";
  const amount = Number(value || 0);
  return `${symbol}${amount.toFixed(2)}`;
}

function rowTemplate() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="text" class="item-desc" placeholder="Service or product"></td>
    <td><input type="number" class="item-qty" min="0" step="0.01" value="1"></td>
    <td><input type="number" class="item-price" min="0" step="0.01" value="0"></td>
    <td class="item-line-total text-right">0.00</td>
    <td><button type="button" class="btn btn-sm btn-danger-outline btn-remove-item"><i class="fa-solid fa-trash"></i></button></td>
  `;
  return tr;
}

function items() {
  if (!itemsBody) return [];
  return [...itemsBody.querySelectorAll("tr")].map((tr) => ({
    desc: tr.querySelector(".item-desc").value.trim() || "Item",
    qty: Number(tr.querySelector(".item-qty").value || 0),
    price: Number(tr.querySelector(".item-price").value || 0),
  }));
}

function calc() {
  const rows = items();
  let subtotal = 0;
  rows.forEach((row, i) => {
    const line = row.qty * row.price;
    subtotal += line;
    const tr = itemsBody.querySelectorAll("tr")[i];
    if (tr) tr.querySelector(".item-line-total").textContent = line.toFixed(2);
  });
  const taxRate = Number(document.getElementById("tax-rate").value || 0);
  const discountVal = Number(document.getElementById("discount-val").value || 0);
  const discountType = document.getElementById("discount-type").value;
  const shipping = Number(document.getElementById("shipping-fee").value || 0);
  const discount = discountType === "percent" ? subtotal * (discountVal / 100) : discountVal;
  const taxable = Math.max(subtotal - discount, 0);
  const tax = taxable * (taxRate / 100);
  const total = taxable + tax + shipping;
  return { rows, subtotal, discount, tax, shipping, total };
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "";
}

function toggleRow(id, show) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("hidden", !show);
}

function collect() {
  return {
    bizName: document.getElementById("biz-name").value,
    bizEmail: document.getElementById("biz-email").value,
    bizPhone: document.getElementById("biz-phone").value,
    bizTaxId: document.getElementById("biz-taxid").value,
    bizAddress: document.getElementById("biz-address").value,
    clientName: document.getElementById("client-name").value,
    clientEmail: document.getElementById("client-email").value,
    clientPhone: document.getElementById("client-phone").value,
    clientTaxId: document.getElementById("client-taxid").value,
    clientAddress: document.getElementById("client-address").value,
    invNumber: document.getElementById("inv-number").value,
    invDate: document.getElementById("inv-date").value,
    invDueDate: document.getElementById("inv-duedate").value,
    currency: currencyEl.value,
    status: document.getElementById("inv-status").value,
    color: document.getElementById("inv-color").value,
    taxRate: document.getElementById("tax-rate").value,
    discountVal: document.getElementById("discount-val").value,
    discountType: document.getElementById("discount-type").value,
    shipping: document.getElementById("shipping-fee").value,
    paymentNotes: document.getElementById("payment-notes").value,
    termsNotes: document.getElementById("terms-notes").value,
    template: document.getElementById("template-select").value,
    logo: document.getElementById("logo-preview").src || "",
    items: items(),
  };
}

function renderPreview() {
  if (!isGenerator) return;
  const data = collect();
  const totals = calc();
  setText("view-biz-name", data.bizName || "Your Company Name");
  setText("view-biz-address", data.bizAddress || "Business Address Line");
  setText("view-biz-contact", [data.bizEmail, data.bizPhone].filter(Boolean).join(" | "));
  setText("view-biz-taxid", data.bizTaxId ? `Tax ID: ${data.bizTaxId}` : "");
  setText("view-client-name", data.clientName || "Client Name");
  setText("view-client-address", data.clientAddress || "Client Address");
  setText("view-client-contact", [data.clientEmail, data.clientPhone].filter(Boolean).join(" | "));
  setText("view-client-taxid", data.clientTaxId ? `Tax ID: ${data.clientTaxId}` : "");
  setText("view-inv-number", data.invNumber || "INV-2026-001");
  setText("view-inv-date", data.invDate || "-");
  setText("view-inv-duedate", data.invDueDate || "-");
  setText("view-payment-notes", data.paymentNotes);
  setText("view-terms-notes", data.termsNotes);

  const badge = document.getElementById("view-status-badge");
  badge.textContent = data.status;
  badge.className = `status-badge status-${String(data.status || "unpaid").toLowerCase()}`;

  const sheet = document.getElementById("invoice-sheet");
  sheet.className = `invoice-sheet ${document.getElementById("template-select").value}`;
  sheet.style.setProperty("--primary", data.color);

  const logo = document.getElementById("view-logo");
  if (data.logo) {
    logo.src = data.logo;
    logo.classList.remove("hidden");
  } else {
    logo.src = "";
    logo.classList.add("hidden");
  }

  viewItemsBody.innerHTML = totals.rows.map((row, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${row.desc}</td>
      <td class="text-center">${row.qty}</td>
      <td class="text-right">${money(row.price)}</td>
      <td class="text-right">${money(row.qty * row.price)}</td>
    </tr>
  `).join("") || `<tr><td colspan="5" class="text-muted">No items yet</td></tr>`;

  setText("view-subtotal", money(totals.subtotal));
  document.getElementById("view-discount").textContent = `-${money(totals.discount)}`;
  document.getElementById("view-tax").textContent = money(totals.tax);
  document.getElementById("view-shipping").textContent = money(totals.shipping);
  document.getElementById("view-total").textContent = money(totals.total);
  toggleRow("row-view-discount", totals.discount > 0);
  toggleRow("row-view-tax", totals.tax > 0);
  toggleRow("row-view-shipping", totals.shipping > 0);
}

function fill(data) {
  const map = {
    "biz-name": data.bizName, "biz-email": data.bizEmail, "biz-phone": data.bizPhone, "biz-taxid": data.bizTaxId,
    "biz-address": data.bizAddress, "client-name": data.clientName, "client-email": data.clientEmail,
    "client-phone": data.clientPhone, "client-taxid": data.clientTaxId, "client-address": data.clientAddress,
    "inv-number": data.invNumber, "inv-date": data.invDate, "inv-duedate": data.invDueDate,
    "inv-currency": data.currency, "inv-status": data.status, "inv-color": data.color,
    "tax-rate": data.taxRate, "discount-val": data.discountVal, "discount-type": data.discountType,
    "shipping-fee": data.shipping, "payment-notes": data.paymentNotes, "terms-notes": data.termsNotes,
    "template-select": data.template,
  };
  Object.entries(map).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.value = value;
  });
  itemsBody.innerHTML = "";
  (data.items && data.items.length ? data.items : [{ desc: "", qty: 1, price: 0 }]).forEach((item) => {
    const tr = rowTemplate();
    tr.querySelector(".item-desc").value = item.desc || "";
    tr.querySelector(".item-qty").value = item.qty ?? 1;
    tr.querySelector(".item-price").value = item.price ?? 0;
    itemsBody.appendChild(tr);
  });
  if (data.logo) {
    document.getElementById("logo-preview").src = data.logo;
    document.getElementById("logo-preview").classList.remove("hidden");
    document.getElementById("logo-placeholder").classList.add("hidden");
    document.getElementById("btn-remove-logo").classList.remove("hidden");
  }
  bindItemEvents();
  renderPreview();
}

function savedList() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function persistSaved(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  const count = document.getElementById("saved-count");
  if (count) count.textContent = String(list.length);
}

function renderHistory() {
  const list = savedList();
  persistSaved(list);
  const wrap = document.getElementById("history-list");
  if (!wrap) return;
  wrap.innerHTML = list.length ? list.map((inv, i) => `
    <div class="history-item">
      <div>
        <strong>${inv.invNumber || "Invoice"}</strong>
        <div class="text-muted">${inv.clientName || "No client"} · ${inv.invDate || ""}</div>
      </div>
      <div>
        <button class="btn btn-sm btn-secondary" data-load="${i}">Load</button>
        <button class="btn btn-sm btn-danger-outline" data-del="${i}">Delete</button>
      </div>
    </div>
  `).join("") : `<p class="text-muted">No saved invoices yet.</p>`;
  wrap.querySelectorAll("[data-load]").forEach((btn) => btn.addEventListener("click", () => fill(list[Number(btn.dataset.load)])));
  wrap.querySelectorAll("[data-del]").forEach((btn) => btn.addEventListener("click", () => {
    list.splice(Number(btn.dataset.del), 1);
    persistSaved(list);
    renderHistory();
  }));
}

function bindItemEvents() {
  if (!itemsBody) return;
  itemsBody.querySelectorAll("input").forEach((el) => el.addEventListener("input", renderPreview));
  itemsBody.querySelectorAll(".btn-remove-item").forEach((btn) => btn.addEventListener("click", () => {
    btn.closest("tr").remove();
    if (!itemsBody.children.length) itemsBody.appendChild(rowTemplate());
    bindItemEvents();
    renderPreview();
  }));
}

function todayISO(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function readLogo(file) {
  if (file.size > 2 * 1024 * 1024) { alert("Logo must be under 2MB"); return; }
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById("logo-preview").src = reader.result;
    document.getElementById("logo-preview").classList.remove("hidden");
    document.getElementById("logo-placeholder").classList.add("hidden");
    document.getElementById("btn-remove-logo").classList.remove("hidden");
    renderPreview();
  };
  reader.readAsDataURL(file);
}

if (isGenerator) {
  document.getElementById("btn-add-item").addEventListener("click", () => {
    itemsBody.appendChild(rowTemplate());
    bindItemEvents();
    renderPreview();
  });

  [
    "biz-name","biz-email","biz-phone","biz-taxid","biz-address","client-name","client-email","client-phone",
    "client-taxid","client-address","inv-number","inv-date","inv-duedate","inv-currency","inv-status","inv-color",
    "tax-rate","discount-val","discount-type","shipping-fee","payment-notes","terms-notes","template-select"
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", renderPreview);
  });

  document.getElementById("btn-sample-data").addEventListener("click", () => {
    fill({
      bizName: "InvoiceCraft Studio",
      bizEmail: "hello@invoicecraftgen.netlify.app",
      bizPhone: "+1 (555) 014-2200",
      bizTaxId: "US-778899",
      bizAddress: "221 Market Street\nSan Francisco, CA 94103",
      clientName: "Apex Global Inc.",
      clientEmail: "ap@apexglobal.com",
      clientPhone: "+1 (555) 882-4411",
      clientTaxId: "NY-112233",
      clientAddress: "789 Broadway, Floor 12\nNew York, NY 10001",
      invNumber: "INV-2026-088",
      invDate: todayISO(),
      invDueDate: todayISO(14),
      currency: "$",
      status: "UNPAID",
      color: "#4f46e5",
      taxRate: "8.5",
      discountVal: "50",
      discountType: "flat",
      shipping: "0",
      paymentNotes: "Bank: Chase Bank\nAccount #: 1234 5678 9000\nPayPal: pay@example.com",
      termsNotes: "Payment due within 14 days. Late invoices may incur a 2% monthly fee.",
      template: "template-modern",
      items: [
        { desc: "Brand identity package", qty: 1, price: 1200 },
        { desc: "Landing page design", qty: 12, price: 85 },
        { desc: "SEO setup sprint", qty: 1, price: 450 },
      ],
    });
  });

  document.getElementById("btn-reset").addEventListener("click", () => {
    document.querySelectorAll("input, textarea").forEach((el) => {
      if (el.type === "file" || el.id === "logo-input") return;
      if (el.type === "color") el.value = "#4f46e5";
      else if (el.type === "number") el.value = el.id === "tax-rate" || el.id === "discount-val" || el.id === "shipping-fee" ? "0" : el.value;
      else if (el.id !== "inv-number") el.value = "";
    });
    document.getElementById("inv-number").value = "INV-2026-001";
    document.getElementById("inv-status").value = "UNPAID";
    document.getElementById("template-select").value = "template-modern";
    document.getElementById("btn-remove-logo").click();
    itemsBody.innerHTML = "";
    itemsBody.appendChild(rowTemplate());
    bindItemEvents();
    renderPreview();
  });

  document.getElementById("btn-save").addEventListener("click", () => {
    const list = savedList();
    list.unshift({ ...collect(), savedAt: new Date().toISOString() });
    persistSaved(list);
    renderHistory();
  });

  document.getElementById("btn-print").addEventListener("click", () => window.print());

  document.getElementById("btn-download-pdf").addEventListener("click", () => {
    const sheet = document.getElementById("invoice-sheet");
    const opt = {
      margin: 0.3,
      filename: `${document.getElementById("inv-number").value || "invoice"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    if (window.html2pdf) window.html2pdf().set(opt).from(sheet).save();
    else window.print();
  });

  document.getElementById("btn-history").addEventListener("click", () => {
    document.getElementById("modal-history").classList.remove("hidden");
    renderHistory();
  });
  document.getElementById("btn-close-modal").addEventListener("click", () => {
    document.getElementById("modal-history").classList.add("hidden");
  });

  const dropzone = document.getElementById("logo-dropzone");
  const logoInput = document.getElementById("logo-input");
  if (dropzone && logoInput) {
    dropzone.addEventListener("click", () => logoInput.click());
    dropzone.addEventListener("dragover", (e) => { e.preventDefault(); });
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      if (e.dataTransfer.files[0]) readLogo(e.dataTransfer.files[0]);
    });
    logoInput.addEventListener("change", () => {
      if (logoInput.files[0]) readLogo(logoInput.files[0]);
    });
  }
  document.getElementById("btn-remove-logo").addEventListener("click", (e) => {
    e.stopPropagation();
    document.getElementById("logo-preview").src = "";
    document.getElementById("logo-preview").classList.add("hidden");
    document.getElementById("logo-placeholder").classList.remove("hidden");
    document.getElementById("btn-remove-logo").classList.add("hidden");
    renderPreview();
  });

  if (!itemsBody.children.length) itemsBody.appendChild(rowTemplate());
  if (!document.getElementById("inv-date").value) document.getElementById("inv-date").value = todayISO();
  if (!document.getElementById("inv-duedate").value) document.getElementById("inv-duedate").value = todayISO(15);
  bindItemEvents();
  persistSaved(savedList());
  renderPreview();
}

(function cookieNotice() {
  const banner = document.getElementById("cookie-banner");
  const btn = document.getElementById("cookie-accept");
  if (!banner || !btn) return;
  if (!localStorage.getItem("invoicecraft.cookie.ok")) banner.classList.remove("hidden");
  btn.addEventListener("click", () => {
    localStorage.setItem("invoicecraft.cookie.ok", "1");
    banner.classList.add("hidden");
  });
})();

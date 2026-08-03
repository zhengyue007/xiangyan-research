(function () {
  "use strict";

  var SUPABASE_URL = "https://zxxxmohnslqincgzokel.supabase.co";
  var SUPABASE_KEY = "sb_publishable_4lqp3fkI0T7w_OpUh9fBFg_THEuIOnO";
  var sb = (typeof supabase !== "undefined" && supabase.createClient)
    ? supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

  var VIEW_WINDOW_MS = 10 * 60 * 1000;
  var VIEW_KEY = "xiangyan_site_view_ts";

  function setViewNumber(n) {
    var el = document.getElementById("site-view-count");
    if (el) el.textContent = String(n);
  }

  function maybeCountView() {
    if (!sb) return;
    var last = parseInt(localStorage.getItem(VIEW_KEY) || "0", 10) || 0;
    var now = Date.now();
    if (now - last < VIEW_WINDOW_MS) {
      sb.from("site_stats").select("views").eq("id", 1).maybeSingle().then(function (res) {
        if (!res.error && res.data) setViewNumber(res.data.views);
      });
      return;
    }
    sb.rpc("increment_site_views").then(function (res) {
      if (res.error) {
        sb.from("site_stats").select("views").eq("id", 1).maybeSingle().then(function (r2) {
          if (!r2.error && r2.data) setViewNumber(r2.data.views);
        });
        return;
      }
      if (typeof res.data === "number" || typeof res.data === "string") {
        localStorage.setItem(VIEW_KEY, String(now));
        setViewNumber(res.data);
      }
    });
  }

  maybeCountView();

  function escapeHtml(s) {
    var d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function htmlToText(html) {
    var d = document.createElement("div");
    d.innerHTML = sanitizeHtml(html || "");
    return d.textContent;
  }

  function sanitizeHtml(html) {
    var allowed = { FONT: 1, SPAN: 1, B: 1, STRONG: 1, I: 1, EM: 1, U: 1, S: 1, P: 1, DIV: 1, BR: 1, UL: 1, OL: 1, LI: 1 };
    var doc = new DOMParser().parseFromString(html || "", "text/html");

    function clean(node) {
      Array.prototype.slice.call(node.children).forEach(function (child) {
        var tag = child.tagName ? child.tagName.toUpperCase() : "";
        if (!allowed[tag]) {
          while (child.firstChild) node.insertBefore(child.firstChild, child);
          node.removeChild(child);
          clean(node);
          return;
        }
        Array.prototype.slice.call(child.attributes).forEach(function (attr) {
          var name = attr.name.toLowerCase();
          var value = attr.value.toLowerCase();
          if (name.indexOf("on") === 0 || value.indexOf("javascript:") === 0) {
            child.removeAttribute(attr.name);
          }
        });
        clean(child);
      });
    }
    clean(doc.body);
    return doc.body.innerHTML;
  }

  var toggle = document.querySelector("[data-nav-toggle]");
  var nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var filterAppliers = [];

  document.querySelectorAll("[data-filter-bar]").forEach(function (bar) {
    var input = bar.querySelector("[data-search]");
    var buttons = Array.prototype.slice.call(bar.querySelectorAll("[data-filter]"));
    var target = document.querySelector(bar.getAttribute("data-target"));

    function apply() {
      var query = input ? input.value.trim().toLowerCase() : "";
      var active = bar.querySelector("[data-filter].is-active");
      var filter = active ? active.getAttribute("data-filter") : "all";
      var items = target ? Array.prototype.slice.call(target.querySelectorAll("[data-tags]")) : [];

      items.forEach(function (item) {
        var tags = item.getAttribute("data-tags") || "";
        var matchTag = filter === "all" || tags.split(/\s+/).indexOf(filter) !== -1;
        var matchQuery = !query || (item.textContent || "").toLowerCase().indexOf(query) !== -1;
        item.classList.toggle("is-hidden", !(matchTag && matchQuery));
      });

      var emptyEl = target && target.id ? document.getElementById(target.id + "-empty") : null;
      if (emptyEl) {
        var hasVisible = items.some(function (item) { return !item.classList.contains("is-hidden"); });
        emptyEl.hidden = hasVisible;
      }
    }

    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        buttons.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        apply();
      });
    });

    if (input) input.addEventListener("input", apply);

    filterAppliers.push(apply);
  });

  initNotes();
  initCases();
  initLiterature();
  initResources();
  initJournals();
  initAdmin();

  function initNotes() {
    var noteList = document.getElementById("note-list");
    if (!noteList) return;

    var formWrap = document.getElementById("add-note-form");
    var toggleFormBtn = document.getElementById("toggle-add-note");
    var hint = document.getElementById("add-note-hint");

    function addCard(note) {
      var article = document.createElement("article");
      article.className = "card entry";
      article.setAttribute("data-tags", note.status || "草稿");
      article.setAttribute("data-id", note.id || "");
      article.setAttribute("data-custom", "1");

      var head = document.createElement("div");
      head.className = "entry-head";
      var h3 = document.createElement("h3");
      h3.className = "entry-title";
      h3.textContent = note.title || "未命名笔记";
      var status = document.createElement("span");
      status.className = "status";
      status.textContent = note.status || "草稿";
      head.appendChild(h3);
      head.appendChild(status);

      var detail = document.createElement("div");
      detail.className = "note-detail";
      var dp = document.createElement("p");
      dp.textContent = note.detail || "";
      detail.appendChild(dp);

      var links = document.createElement("p");
      links.className = "entry-links";
      var expandBtn = document.createElement("button");
      expandBtn.className = "note-toggle";
      expandBtn.setAttribute("data-expand", "1");
      expandBtn.type = "button";
      expandBtn.textContent = "展开阅读";
      links.appendChild(expandBtn);

      if (document.body.classList.contains("is-admin")) {
        var removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.setAttribute("data-remove", "1");
        removeBtn.type = "button";
        removeBtn.textContent = "删除";
        links.appendChild(removeBtn);
      }

      article.appendChild(head);
      article.appendChild(detail);
      article.appendChild(links);
      noteList.appendChild(article);
    }

    function loadNotes() {
      if (!sb) return;
      sb.from("notes").select("*").order("created_at", { ascending: true })
        .then(function (res) {
          if (res.error) {
            window.alert("笔记加载失败：" + res.error.message);
            return;
          }
          (res.data || []).forEach(addCard);
          filterAppliers.forEach(function (fn) { fn(); });
        });
    }

    noteList.addEventListener("click", function (e) {
      var card = e.target.closest(".entry");
      if (!card) return;

      if (e.target.closest("[data-expand]")) {
        var isOpen = card.classList.toggle("is-open");
        var btn = card.querySelector("[data-expand]");
        if (btn) btn.textContent = isOpen ? "收起" : "展开阅读";
      }

      if (e.target.closest("[data-remove]")) {
        if (!window.confirm("确定删除这篇笔记吗？")) return;
        var id = card.getAttribute("data-id");
        if (sb && id) {
          sb.from("notes").delete().eq("id", id).then(function (res) {
            if (res.error) {
              window.alert("删除失败：" + res.error.message);
              return;
            }
            card.remove();
            filterAppliers.forEach(function (fn) { fn(); });
          });
        } else {
          card.remove();
        }
      }
    });

    if (toggleFormBtn && formWrap) {
      toggleFormBtn.addEventListener("click", function () {
        var show = formWrap.hidden;
        formWrap.hidden = !show;
        toggleFormBtn.textContent = show ? "收起表单" : "＋ 添加笔记";
      });
    }

    if (formWrap) {
      formWrap.addEventListener("submit", function (e) {
        e.preventDefault();
        var titleInput = document.getElementById("note-title");
        var statusSelect = document.getElementById("note-status");
        var detailInput = document.getElementById("note-detail");
        if (!titleInput || !detailInput) return;
        var title = titleInput.value.trim();
        var detail = detailInput.value.trim();
        if (!title || !detail) return;

        sb.from("notes").insert({
          title: title,
          status: statusSelect.value,
          detail: detail
        }).select().single().then(function (res) {
          if (res.error) {
            window.alert("保存失败：" + res.error.message);
            return;
          }
          if (res.data) addCard(res.data);
          filterAppliers.forEach(function (fn) { fn(); });
          formWrap.reset();
          if (hint) hint.hidden = false;
        });
      });
    }

    loadNotes();
  }

  function initCases() {
    var caseList = document.getElementById("case-list");
    if (!caseList) return;

    var formWrap = document.getElementById("add-case-form");
    var toggleFormBtn = document.getElementById("toggle-add-case");
    var hint = document.getElementById("add-case-hint");
    var customWrap = document.getElementById("case-type-custom-wrap");
    var customInput = document.getElementById("case-type-custom");
    var nameInput = document.getElementById("case-name");
    var typeSelect = document.getElementById("case-type");
    var descEditor = document.querySelector('[data-rich="case-desc"]');
    var researchEditor = document.querySelector('[data-rich="case-research"]');
    var photoInput = document.getElementById("case-photo");
    var photoNote = document.getElementById("case-photo-note");
    var editingId = null;
    var editingPhoto = "";
    function addCard(item) {
      var article = document.createElement("article");
      article.className = "card entry";
      article.setAttribute("data-tags", item.type || item.direction || "综合");
      article.setAttribute("data-id", item.id || "");
      article.setAttribute("data-custom", "1");
      article.setAttribute("data-type", item.type || item.direction || "综合");
      article.setAttribute("data-research", item.research || "");
      article.setAttribute("data-research-html", item.research_html || "");
      article.setAttribute("data-photo", item.photo_url || "");

      var head = document.createElement("div");
      head.className = "entry-head";
      var h3 = document.createElement("h3");
      h3.className = "entry-title";
      h3.textContent = item.name || "未命名案例";
      var dir = document.createElement("span");
      dir.className = "status";
      dir.setAttribute("data-case-type", "1");
      dir.textContent = item.type || item.direction || "综合";
      head.appendChild(h3);
      head.appendChild(dir);

      var photoWrap = null;
      if (item.photo_url) {
        photoWrap = document.createElement("div");
        photoWrap.className = "case-photo";
        var img = document.createElement("img");
        img.src = item.photo_url;
        img.alt = item.name || "案例照片";
        photoWrap.appendChild(img);
      }

      var researchWrap = null;
      var researchText = null;
      if (item.research) {
        researchWrap = document.createElement("div");
        researchWrap.className = "case-research";
        var rLabel = document.createElement("span");
        rLabel.className = "field-label";
        rLabel.textContent = "已有研究";
        researchWrap.appendChild(rLabel);
        researchText = document.createElement("p");
        researchText.className = "research-text";
        if (item.research_html) {
          researchText.innerHTML = sanitizeHtml(item.research_html);
        } else {
          researchText.textContent = item.research;
        }
        researchWrap.appendChild(researchText);
      }

      var summaryWrap = document.createElement("div");
      summaryWrap.className = "case-summary";
      var sLabel = document.createElement("span");
      sLabel.className = "field-label";
      sLabel.textContent = "案例介绍";
      var summary = document.createElement("p");
      summary.className = "entry-summary";
      summary.textContent = item.description || htmlToText(item.description_html) || item.desc || "";
      summaryWrap.appendChild(sLabel);
      summaryWrap.appendChild(summary);
      article.setAttribute("data-full-html", item.description_html || escapeHtml(item.description || item.desc || ""));

      var links = document.createElement("p");
      links.className = "entry-links";
      if (document.body.classList.contains("is-admin")) {
        var editBtn = document.createElement("button");
        editBtn.className = "edit-btn";
        editBtn.setAttribute("data-edit", "1");
        editBtn.type = "button";
        editBtn.textContent = "编辑";
        links.appendChild(editBtn);

        var removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.setAttribute("data-remove", "1");
        removeBtn.type = "button";
        removeBtn.textContent = "删除";
        links.appendChild(removeBtn);
      }

      article.appendChild(head);
      if (photoWrap) article.appendChild(photoWrap);
      if (researchWrap) article.appendChild(researchWrap);
      article.appendChild(summaryWrap);
      article.appendChild(links);
      caseList.appendChild(article);

      var researchLong = researchText && researchText.scrollHeight > researchText.clientHeight + 8;
      var summaryLong = summary.scrollHeight > summary.clientHeight + 8;
      if (researchLong || summaryLong) {
        var expandBtn = document.createElement("button");
        expandBtn.className = "note-toggle";
        expandBtn.setAttribute("data-expand", "1");
        expandBtn.type = "button";
        expandBtn.textContent = "展开全文";
        links.insertBefore(expandBtn, links.firstChild);
      }
    }

    function loadCases() {
      if (!sb) return;
      sb.from("cases").select("*").order("created_at", { ascending: true })
        .then(function (res) {
          if (res.error) {
            window.alert("案例加载失败：" + res.error.message);
            return;
          }
          (res.data || []).forEach(addCard);
          filterAppliers.forEach(function (fn) { fn(); });
        });
    }

    var modal = null;

    function buildModal() {
      var overlay = document.createElement("div");
      overlay.className = "case-modal-overlay";
      var panel = document.createElement("div");
      panel.className = "case-modal";
      var head = document.createElement("div");
      head.className = "case-modal-head";
      var title = document.createElement("h3");
      title.textContent = "案例介绍";
      var closeBtn = document.createElement("button");
      closeBtn.className = "modal-close";
      closeBtn.type = "button";
      closeBtn.textContent = "关闭";
      head.appendChild(title);
      head.appendChild(closeBtn);
      var body = document.createElement("div");
      body.className = "case-modal-body";
      panel.appendChild(head);
      panel.appendChild(body);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);

      function close() {
        overlay.classList.remove("is-open");
        document.body.classList.remove("modal-open");
      }
      closeBtn.addEventListener("click", close);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) close();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
      });
      return { overlay: overlay, body: body };
    }

    function openCaseModal(titleText, researchHtml, descHtml) {
      if (!modal) modal = buildModal();
      var h = modal.overlay.querySelector(".case-modal-head h3");
      if (h) h.textContent = titleText;
      var body = modal.body;
      body.innerHTML = "";
      if (researchHtml) {
        var rBlock = document.createElement("div");
        var rLabel = document.createElement("span");
        rLabel.className = "field-label";
        rLabel.textContent = "已有研究";
        rBlock.appendChild(rLabel);
        rBlock.insertAdjacentHTML("beforeend", sanitizeHtml(researchHtml));
        body.appendChild(rBlock);
      }
      if (descHtml) {
        var dBlock = document.createElement("div");
        var dLabel = document.createElement("span");
        dLabel.className = "field-label";
        dLabel.textContent = "案例介绍";
        dBlock.appendChild(dLabel);
        dBlock.insertAdjacentHTML("beforeend", sanitizeHtml(descHtml));
        body.appendChild(dBlock);
      }
      modal.overlay.classList.add("is-open");
      document.body.classList.add("modal-open");
    }

    function resetCaseForm() {
      editingId = null;
      editingPhoto = "";
      formWrap.reset();
      if (descEditor) descEditor.innerHTML = "";
      if (researchEditor) researchEditor.innerHTML = "";
      if (customWrap) customWrap.hidden = true;
      var sbBtn = formWrap.querySelector('button[type="submit"]');
      if (sbBtn) sbBtn.textContent = "保存案例";
      toggleFormBtn.textContent = "＋ 添加案例";
      formWrap.hidden = true;
      if (photoNote) photoNote.hidden = true;
    }

    function startEdit(card) {
      var id = card.getAttribute("data-id");
      if (!id) return;
      editingId = id;
      editingPhoto = card.getAttribute("data-photo") || "";
      var titleEl = card.querySelector(".entry-title");
      if (nameInput) nameInput.value = titleEl ? titleEl.textContent : "";
      var type = card.getAttribute("data-type") || "综合";
      var presets = ["乡村旅游", "乡村发展", "产业发展", "综合"];
      if (presets.indexOf(type) !== -1) {
        typeSelect.value = type;
        if (customWrap) customWrap.hidden = true;
      } else {
        typeSelect.value = "__custom";
        if (customWrap) customWrap.hidden = false;
        if (customInput) customInput.value = type;
      }
      if (researchEditor) {
        researchEditor.innerHTML = sanitizeHtml(
          card.getAttribute("data-research-html") || escapeHtml(card.getAttribute("data-research") || "")
        );
      }
      if (descEditor) {
        descEditor.innerHTML = sanitizeHtml(card.getAttribute("data-full-html") || "");
      }
      if (photoInput) photoInput.value = "";
      if (photoNote) photoNote.hidden = false;
      var sbBtn = formWrap.querySelector('button[type="submit"]');
      if (sbBtn) sbBtn.textContent = "保存修改";
      toggleFormBtn.textContent = "取消编辑";
      formWrap.hidden = false;
      formWrap.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    caseList.addEventListener("click", function (e) {
      var card = e.target.closest(".entry");
      if (!card) return;
      if (e.target.closest("[data-edit]")) {
        startEdit(card);
        return;
      }
      if (e.target.closest("[data-expand]")) {
        var titleEl = card.querySelector(".entry-title");
        var researchHtml = card.getAttribute("data-research-html") || escapeHtml(card.getAttribute("data-research") || "");
        openCaseModal(titleEl ? titleEl.textContent : "案例", researchHtml, card.getAttribute("data-full-html") || "");
      }
      if (e.target.closest("[data-remove]")) {
        if (!window.confirm("确定删除这个案例吗？")) return;
        var id = card.getAttribute("data-id");
        if (sb && id) {
          sb.from("cases").delete().eq("id", id).then(function (res) {
            if (res.error) {
              window.alert("删除失败：" + res.error.message);
              return;
            }
            card.remove();
            filterAppliers.forEach(function (fn) { fn(); });
          });
        } else {
          card.remove();
        }
      }
    });

    if (toggleFormBtn && formWrap) {
      toggleFormBtn.addEventListener("click", function () {
        if (editingId) {
          resetCaseForm();
          return;
        }
        var show = formWrap.hidden;
        formWrap.hidden = !show;
        toggleFormBtn.textContent = show ? "收起表单" : "＋ 添加案例";
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener("change", function () {
        var isCustom = typeSelect.value === "__custom";
        if (customWrap) customWrap.hidden = !isCustom;
      });
    }

    document.querySelectorAll("[data-rich-toolbar]").forEach(function (toolbar) {
      var targetId = toolbar.getAttribute("data-rich-toolbar");
      var editor = document.querySelector('[data-rich="' + targetId + '"]');
      if (!editor) return;

      var painterStyles = null;
      var painterBtn = toolbar.querySelector('[data-cmd="formatPainter"]');

      if (painterBtn) {
        painterBtn.addEventListener("mousedown", function (e) {
          e.preventDefault();
          if (painterStyles) {
            applyPainter();
          } else {
            capturePainter();
          }
        });
      }

      function capturePainter() {
        var sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        var node = sel.getRangeAt(0).startContainer;
        var el = node.nodeType === 1 ? node : node.parentElement;
        var cs = window.getComputedStyle(el);
        painterStyles = {
          color: cs.color,
          backgroundColor: cs.backgroundColor && cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : "",
          fontSize: cs.fontSize,
          fontFamily: cs.fontFamily,
          bold: cs.fontWeight === "bold" || parseInt(cs.fontWeight, 10) >= 600,
          italic: cs.fontStyle === "italic",
          underline: (cs.textDecorationLine || "").indexOf("underline") !== -1,
          textAlign: cs.textAlign,
          textIndent: cs.textIndent,
          lineHeight: cs.lineHeight
        };
        if (painterBtn) painterBtn.classList.add("is-active");
      }

      function applyPainter() {
        if (!painterStyles) return;
        var sel = window.getSelection();
        if (!sel || !sel.rangeCount || sel.isCollapsed) return;

        var range = sel.getRangeAt(0);
        var span = document.createElement("span");
        if (painterStyles.color) span.style.color = painterStyles.color;
        if (painterStyles.backgroundColor) span.style.backgroundColor = painterStyles.backgroundColor;
        if (painterStyles.fontSize) span.style.fontSize = painterStyles.fontSize;
        if (painterStyles.fontFamily) span.style.fontFamily = painterStyles.fontFamily;
        if (painterStyles.bold) span.style.fontWeight = "bold";
        if (painterStyles.italic) span.style.fontStyle = "italic";
        if (painterStyles.underline) span.style.textDecoration = "underline";
        var frag = range.extractContents();
        span.appendChild(frag);
        range.insertNode(span);

        var block = span.parentElement || span;
        while (block && block !== editor && !/^(P|DIV|LI|H[1-6])$/.test(block.tagName)) {
          block = block.parentElement;
        }
        if (block && block !== editor) {
          if (painterStyles.textAlign) block.style.textAlign = painterStyles.textAlign;
          if (painterStyles.textIndent) block.style.textIndent = painterStyles.textIndent;
          if (painterStyles.lineHeight) block.style.lineHeight = painterStyles.lineHeight;
        }

        painterStyles = null;
        if (painterBtn) painterBtn.classList.remove("is-active");
      }

      editor.addEventListener("mouseup", function () {
        if (!painterStyles) return;
        var s = window.getSelection();
        if (s && s.rangeCount && !s.isCollapsed) applyPainter();
      });

      toolbar.querySelectorAll("[data-cmd]").forEach(function (ctl) {
        if (ctl.tagName === "SELECT") {
          ctl.addEventListener("change", function () {
            editor.focus();
            document.execCommand("fontSize", false, ctl.value);
          });
          return;
        }
        if (ctl.type === "color") {
          ctl.addEventListener("input", function () {
            editor.focus();
            document.execCommand(ctl.getAttribute("data-cmd"), false, ctl.value);
          });
          return;
        }
        ctl.addEventListener("click", function () {
          editor.focus();
          var cmd = ctl.getAttribute("data-cmd");
          if (cmd === "formatPainter") {
            return;
          }
          if (cmd === "firstLine") {
            document.execCommand("styleWithCSS", false, true);
            var sel = window.getSelection();
            if (sel && sel.rangeCount) {
              var node = sel.getRangeAt(0).startContainer;
              var block = node.nodeType === 1 ? node : node.parentNode;
              while (block && block !== editor && block !== document.body) {
                var tag = block.tagName ? block.tagName.toUpperCase() : "";
                if (tag === "P" || tag === "DIV" || tag === "LI" || tag.indexOf("H") === 0) break;
                block = block.parentNode;
              }
              if (block && block !== editor) {
                block.style.textIndent = block.style.textIndent === "2em" ? "" : "2em";
              }
            }
            return;
          }
          document.execCommand(cmd, false, null);
        });
      });
    });

    if (formWrap) {
      formWrap.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!nameInput || !descEditor) return;
        var name = nameInput.value.trim();
        var desc = descEditor.innerText.trim();
        var descHtml = sanitizeHtml(descEditor.innerHTML);
        if (!name || !desc) return;

        var type = typeSelect.value;
        if (type === "__custom") {
          type = customInput ? customInput.value.trim() : "";
          if (!type) {
            window.alert("请填写自定义案例类型。");
            return;
          }
        }
        var research = researchEditor ? researchEditor.innerText.trim() : "";
        var researchHtml = researchEditor ? sanitizeHtml(researchEditor.innerHTML) : "";

        function afterSave(res) {
          if (res.error) {
            window.alert("保存失败：" + res.error.message);
            return;
          }
          if (editingId) {
            var old = caseList.querySelector('[data-id="' + editingId + '"]');
            if (old) old.remove();
          }
          if (res.data) addCard(res.data);
          filterAppliers.forEach(function (fn) { fn(); });
          resetCaseForm();
          if (hint) hint.hidden = false;
        }

        function finish(photoUrl) {
          var payload = {
            name: name,
            type: type,
            research: research,
            research_html: researchHtml,
            description: desc,
            description_html: descHtml,
            photo_url: photoUrl || editingPhoto || null
          };
          if (editingId) {
            sb.from("cases").update(payload).eq("id", editingId).select().single().then(afterSave);
          } else {
            sb.from("cases").insert(payload).select().single().then(afterSave);
          }
        }

        var file = photoInput && photoInput.files && photoInput.files[0];
        if (file && sb) {
          if (file.size > 2 * 1024 * 1024) {
            window.alert("照片较大，建议选择 2MB 以内的图片。");
          }
          var ext = (file.name || "").split(".").pop() || "jpg";
          ext = ext.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
          var path = "case-" + Date.now() + "." + ext;
          sb.storage.from("case-photos").upload(path, file).then(function (up) {
            if (up.error) {
              window.alert("照片上传失败：" + up.error.message);
              return;
            }
            var pub = sb.storage.from("case-photos").getPublicUrl(path);
            finish(pub.data ? pub.data.publicUrl : "");
          });
        } else {
          finish("");
        }
      });
    }

    loadCases();
  }

  function initLiterature() {
    var litList = document.getElementById("entry-list");
    if (!litList) return;

    var formWrap = document.getElementById("add-lit-form");
    var toggleFormBtn = document.getElementById("toggle-add-lit");
    var hint = document.getElementById("add-lit-hint");

    function addCard(item) {
      var article = document.createElement("article");
      article.className = "card entry";
      article.setAttribute("data-tags", item.direction || "乡村发展");
      article.setAttribute("data-id", item.id || "");
      article.setAttribute("data-custom", "1");

      var head = document.createElement("div");
      head.className = "entry-head";
      var h3 = document.createElement("h3");
      h3.className = "entry-title";
      h3.textContent = item.title || "未命名文献";
      var dir = document.createElement("span");
      dir.className = "status";
      dir.textContent = item.direction || "乡村发展";
      head.appendChild(h3);
      head.appendChild(dir);

      var meta = document.createElement("p");
      meta.className = "entry-meta";
      meta.textContent = item.source || "";

      var summary = document.createElement("p");
      summary.className = "entry-summary";
      summary.textContent = item.summary || "";

      var tags = document.createElement("p");
      tags.className = "tag-row";
      var chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = item.direction || "乡村发展";
      tags.appendChild(chip);

      var links = document.createElement("p");
      links.className = "entry-links";
      if (item.link) {
        var a = document.createElement("a");
        a.className = "source-link";
        a.href = item.link;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "查看原文 ↗";
        links.appendChild(a);
      } else {
        var missing = document.createElement("span");
        missing.className = "source-missing";
        missing.textContent = "暂无链接";
        links.appendChild(missing);
      }

      if (document.body.classList.contains("is-admin")) {
        var removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.setAttribute("data-remove", "1");
        removeBtn.type = "button";
        removeBtn.textContent = "删除";
        links.appendChild(removeBtn);
      }

      article.appendChild(head);
      article.appendChild(meta);
      article.appendChild(summary);
      article.appendChild(tags);
      article.appendChild(links);
      litList.appendChild(article);
    }

    function loadLiterature() {
      if (!sb) return;
      sb.from("literature").select("*").order("created_at", { ascending: true })
        .then(function (res) {
          if (res.error) {
            window.alert("文献加载失败：" + res.error.message);
            return;
          }
          (res.data || []).forEach(addCard);
          filterAppliers.forEach(function (fn) { fn(); });
        });
    }

    litList.addEventListener("click", function (e) {
      var card = e.target.closest(".entry");
      if (!card) return;
      if (e.target.closest("[data-remove]")) {
        if (!window.confirm("确定删除这条文献吗？")) return;
        var id = card.getAttribute("data-id");
        if (sb && id) {
          sb.from("literature").delete().eq("id", id).then(function (res) {
            if (res.error) {
              window.alert("删除失败：" + res.error.message);
              return;
            }
            card.remove();
            filterAppliers.forEach(function (fn) { fn(); });
          });
        } else {
          card.remove();
        }
      }
    });

    if (toggleFormBtn && formWrap) {
      toggleFormBtn.addEventListener("click", function () {
        var show = formWrap.hidden;
        formWrap.hidden = !show;
        toggleFormBtn.textContent = show ? "收起表单" : "＋ 添加文献";
      });
    }

    if (formWrap) {
      formWrap.addEventListener("submit", function (e) {
        e.preventDefault();
        var titleInput = document.getElementById("lit-title");
        var dirSelect = document.getElementById("lit-direction");
        var sourceInput = document.getElementById("lit-source");
        var linkInput = document.getElementById("lit-link");
        var summaryInput = document.getElementById("lit-summary");
        if (!titleInput) return;
        var title = titleInput.value.trim();
        if (!title) return;

        sb.from("literature").insert({
          title: title,
          direction: dirSelect.value,
          source: sourceInput ? sourceInput.value.trim() : "",
          link: linkInput ? linkInput.value.trim() : "",
          summary: summaryInput ? summaryInput.value.trim() : ""
        }).select().single().then(function (res) {
          if (res.error) {
            window.alert("保存失败：" + res.error.message);
            return;
          }
          if (res.data) addCard(res.data);
          filterAppliers.forEach(function (fn) { fn(); });
          formWrap.reset();
          if (hint) hint.hidden = false;
        });
      });
    }

    loadLiterature();
  }

  function initResources() {
    var resList = document.getElementById("resource-list");
    if (!resList) return;

    var formWrap = document.getElementById("add-res-form");
    var toggleFormBtn = document.getElementById("toggle-add-res");
    var hint = document.getElementById("add-res-hint");

    function addCard(item) {
      var article = document.createElement("article");
      article.className = "card entry";
      article.setAttribute("data-tags", item.category || "数据");
      article.setAttribute("data-id", item.id || "");
      article.setAttribute("data-custom", "1");

      var head = document.createElement("div");
      head.className = "entry-head";
      var h3 = document.createElement("h3");
      h3.className = "entry-title";
      h3.textContent = item.name || "未命名资源";
      var cat = document.createElement("span");
      cat.className = "status";
      cat.textContent = item.category === "工具" ? "分析工具" : "数据资源";
      head.appendChild(h3);
      head.appendChild(cat);

      var desc = document.createElement("p");
      desc.className = "desc";
      desc.textContent = item.description || "";

      var links = document.createElement("p");
      links.className = "entry-links";
      if (item.link) {
        var a = document.createElement("a");
        a.className = "source-link";
        a.href = item.link;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "访问链接 ↗";
        links.appendChild(a);
      }

      if (document.body.classList.contains("is-admin")) {
        var removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.setAttribute("data-remove", "1");
        removeBtn.type = "button";
        removeBtn.textContent = "删除";
        links.appendChild(removeBtn);
      }

      article.appendChild(head);
      article.appendChild(desc);
      article.appendChild(links);
      resList.appendChild(article);
    }

    function loadResources() {
      if (!sb) return;
      sb.from("resources").select("*").order("created_at", { ascending: true })
        .then(function (res) {
          if (res.error) {
            window.alert("资源加载失败：" + res.error.message);
            return;
          }
          (res.data || []).forEach(addCard);
          filterAppliers.forEach(function (fn) { fn(); });
        });
    }

    resList.addEventListener("click", function (e) {
      var card = e.target.closest(".entry");
      if (!card) return;
      if (e.target.closest("[data-remove]")) {
        if (!window.confirm("确定删除这项资源吗？")) return;
        var id = card.getAttribute("data-id");
        if (sb && id) {
          sb.from("resources").delete().eq("id", id).then(function (res) {
            if (res.error) {
              window.alert("删除失败：" + res.error.message);
              return;
            }
            card.remove();
            filterAppliers.forEach(function (fn) { fn(); });
          });
        } else {
          card.remove();
        }
      }
    });

    if (toggleFormBtn && formWrap) {
      toggleFormBtn.addEventListener("click", function () {
        var show = formWrap.hidden;
        formWrap.hidden = !show;
        toggleFormBtn.textContent = show ? "收起表单" : "＋ 添加资源";
      });
    }

    if (formWrap) {
      formWrap.addEventListener("submit", function (e) {
        e.preventDefault();
        var nameInput = document.getElementById("res-name");
        var catSelect = document.getElementById("res-category");
        var descInput = document.getElementById("res-desc");
        var linkInput = document.getElementById("res-link");
        if (!nameInput || !descInput) return;
        var name = nameInput.value.trim();
        var desc = descInput.value.trim();
        if (!name || !desc) return;

        sb.from("resources").insert({
          name: name,
          category: catSelect.value,
          description: desc,
          link: linkInput ? linkInput.value.trim() : ""
        }).select().single().then(function (res) {
          if (res.error) {
            window.alert("保存失败：" + res.error.message);
            return;
          }
          if (res.data) addCard(res.data);
          filterAppliers.forEach(function (fn) { fn(); });
          formWrap.reset();
          if (hint) hint.hidden = false;
        });
      });
    }

    loadResources();
  }

  function initJournals() {
    var jnlList = document.getElementById("journal-list");
    if (!jnlList) return;

    var formWrap = document.getElementById("add-jnl-form");
    var toggleFormBtn = document.getElementById("toggle-add-jnl");
    var hint = document.getElementById("add-jnl-hint");

    function addCard(item) {
      var article = document.createElement("article");
      article.className = "card entry";
      article.setAttribute("data-tags", item.category || "中文期刊");
      article.setAttribute("data-id", item.id || "");
      article.setAttribute("data-custom", "1");

      var head = document.createElement("div");
      head.className = "entry-head";
      var h3 = document.createElement("h3");
      h3.className = "entry-title";
      h3.textContent = item.name || "未命名期刊";
      var cat = document.createElement("span");
      cat.className = "status";
      cat.textContent = item.category || "中文期刊";
      head.appendChild(h3);
      head.appendChild(cat);

      var desc = document.createElement("p");
      desc.className = "entry-summary";
      desc.textContent = item.description || "";

      var tags = document.createElement("p");
      tags.className = "tag-row";
      (item.tags || "").split(/\s+/).filter(function (t) { return t; }).forEach(function (t) {
        var chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = t;
        tags.appendChild(chip);
      });

      var links = document.createElement("p");
      links.className = "entry-links";
      if (item.link) {
        var a = document.createElement("a");
        a.className = "source-link";
        a.href = item.link;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = item.category === "数据库平台" ? "进入平台 ↗" : "进入官网 ↗";
        links.appendChild(a);
      }

      if (document.body.classList.contains("is-admin")) {
        var removeBtn = document.createElement("button");
        removeBtn.className = "remove-btn";
        removeBtn.setAttribute("data-remove", "1");
        removeBtn.type = "button";
        removeBtn.textContent = "删除";
        links.appendChild(removeBtn);
      }

      article.appendChild(head);
      article.appendChild(desc);
      article.appendChild(tags);
      article.appendChild(links);
      jnlList.appendChild(article);
    }

    function loadJournals() {
      if (!sb) return;
      sb.from("journals").select("*").order("created_at", { ascending: true })
        .then(function (res) {
          if (res.error) {
            window.alert("期刊加载失败：" + res.error.message);
            return;
          }
          (res.data || []).forEach(addCard);
          filterAppliers.forEach(function (fn) { fn(); });
        });
    }

    jnlList.addEventListener("click", function (e) {
      var card = e.target.closest(".entry");
      if (!card) return;
      if (e.target.closest("[data-remove]")) {
        if (!window.confirm("确定删除这个期刊条目吗？")) return;
        var id = card.getAttribute("data-id");
        if (sb && id) {
          sb.from("journals").delete().eq("id", id).then(function (res) {
            if (res.error) {
              window.alert("删除失败：" + res.error.message);
              return;
            }
            card.remove();
            filterAppliers.forEach(function (fn) { fn(); });
          });
        } else {
          card.remove();
        }
      }
    });

    if (toggleFormBtn && formWrap) {
      toggleFormBtn.addEventListener("click", function () {
        var show = formWrap.hidden;
        formWrap.hidden = !show;
        toggleFormBtn.textContent = show ? "收起表单" : "＋ 添加期刊";
      });
    }

    if (formWrap) {
      formWrap.addEventListener("submit", function (e) {
        e.preventDefault();
        var nameInput = document.getElementById("jnl-name");
        var catSelect = document.getElementById("jnl-category");
        var tagsInput = document.getElementById("jnl-tags");
        var descInput = document.getElementById("jnl-desc");
        var linkInput = document.getElementById("jnl-link");
        if (!nameInput || !descInput || !linkInput) return;
        var name = nameInput.value.trim();
        var desc = descInput.value.trim();
        var link = linkInput.value.trim();
        if (!name || !desc || !link) return;

        sb.from("journals").insert({
          name: name,
          category: catSelect.value,
          tags: tagsInput ? tagsInput.value.trim() : "",
          description: desc,
          link: link
        }).select().single().then(function (res) {
          if (res.error) {
            window.alert("保存失败：" + res.error.message);
            return;
          }
          if (res.data) addCard(res.data);
          filterAppliers.forEach(function (fn) { fn(); });
          formWrap.reset();
          if (hint) hint.hidden = false;
        });
      });
    }

    loadJournals();
  }

  function initAdmin() {
    var entry = document.getElementById("admin-entry");
    if (!entry) return;

    var adminPassword = "260803";

    if (sessionStorage.getItem("xiangyan_admin") === "1") {
      document.body.classList.add("is-admin");
      entry.textContent = "退出管理";
    }

    entry.addEventListener("click", function () {
      if (document.body.classList.contains("is-admin")) {
        sessionStorage.removeItem("xiangyan_admin");
        window.location.reload();
        return;
      }
      var input = window.prompt("请输入管理密码：");
      if (input === adminPassword) {
        sessionStorage.setItem("xiangyan_admin", "1");
        window.location.reload();
      } else if (input !== null) {
        window.alert("密码错误。");
      }
    });
  }
})();

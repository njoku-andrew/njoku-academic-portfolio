// Shared navigation, academic planner and contact-form behaviour.
document.addEventListener("DOMContentLoaded", () => {
  const currentPage = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-link").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  });

  // Academic planner: tasks remain in this browser between visits.
  const taskForm = document.querySelector("#task-form");
  if (taskForm) {
    const input = document.querySelector("#task-input");
    const list = document.querySelector("#task-list");
    const empty = document.querySelector("#planner-empty");
    const count = document.querySelector("#remaining-count");
    const total = document.querySelector("#task-total");
    const progress = document.querySelector("#progress-fill");
    const progressLabel = document.querySelector("#progress-label");
    const clearCompleted = document.querySelector("#clear-completed");
    const dateLabel = document.querySelector("#today-date");
    const filterButtons = [...document.querySelectorAll(".filter-button")];
    const storageKey = "njokuAcademicPlannerTasks";
    let activeFilter = "all";
    let tasks = [];

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      tasks = Array.isArray(saved) ? saved : [];
    } catch {
      tasks = [];
    }

    dateLabel.textContent = new Intl.DateTimeFormat("en", {
      weekday: "long", day: "numeric", month: "short"
    }).format(new Date()).toUpperCase();

    function saveTasks() {
      try {
        localStorage.setItem(storageKey, JSON.stringify(tasks));
      } catch {
        document.querySelector("#planner-storage").textContent = "SAVING UNAVAILABLE IN THIS BROWSER";
      }
    }

    function renderTasks() {
      list.replaceChildren();
      const visibleTasks = tasks.filter((task) => {
        if (activeFilter === "active") return !task.completed;
        if (activeFilter === "completed") return task.completed;
        return true;
      });

      visibleTasks.forEach((task) => {
        const item = document.createElement("li");
        item.className = `task-item${task.completed ? " completed" : ""}`;

        const check = document.createElement("button");
        check.type = "button";
        check.className = "task-check";
        check.setAttribute("aria-label", task.completed ? "Mark task as not completed" : "Mark task as completed");
        check.setAttribute("aria-pressed", String(task.completed));
        check.textContent = task.completed ? "✓" : "";
        check.addEventListener("click", () => {
          task.completed = !task.completed;
          saveTasks();
          renderTasks();
        });

        const text = document.createElement("span");
        text.className = "task-text";
        text.textContent = task.text;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "delete-task";
        remove.textContent = "Delete";
        remove.setAttribute("aria-label", `Delete ${task.text}`);
        remove.addEventListener("click", () => {
          tasks = tasks.filter((entry) => entry.id !== task.id);
          saveTasks();
          renderTasks();
        });

        item.append(check, text, remove);
        list.append(item);
      });

      const remaining = tasks.filter((task) => !task.completed).length;
      const completed = tasks.length - remaining;
      count.textContent = remaining;
      total.textContent = `${tasks.length} ${tasks.length === 1 ? "ITEM" : "ITEMS"}`;
      progress.style.width = tasks.length ? `${(completed / tasks.length) * 100}%` : "0%";
      progressLabel.textContent = tasks.length
        ? `${completed} of ${tasks.length} completed`
        : "Nothing planned yet";
      empty.classList.toggle("visible", visibleTasks.length === 0);
      if (visibleTasks.length === 0) {
        const title = empty.querySelector("strong");
        const description = empty.querySelector("p");
        if (activeFilter === "completed") {
          title.textContent = "Nothing completed yet.";
          description.textContent = "Finished tasks will appear here.";
        } else if (activeFilter === "active" && tasks.length) {
          title.textContent = "All caught up.";
          description.textContent = "You have completed every task on your list.";
        } else {
          title.textContent = "No tasks here yet.";
          description.textContent = "Add a study task above and it will appear in this list.";
        }
      }
      clearCompleted.disabled = completed === 0;
      clearCompleted.style.opacity = completed === 0 ? ".4" : "1";
    }

    taskForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = input.value.trim();
      if (!text) {
        input.focus();
        return;
      }
      tasks.unshift({ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text, completed: false });
      saveTasks();
      activeFilter = "all";
      filterButtons.forEach((button) => {
        const selected = button.dataset.filter === "all";
        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });
      input.value = "";
      renderTasks();
      input.focus();
    });

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        filterButtons.forEach((entry) => {
          const selected = entry === button;
          entry.classList.toggle("active", selected);
          entry.setAttribute("aria-pressed", String(selected));
        });
        renderTasks();
      });
    });

    clearCompleted.addEventListener("click", () => {
      tasks = tasks.filter((task) => !task.completed);
      saveTasks();
      renderTasks();
    });

    renderTasks();
  }

  // Contact form: validate all required fields before preparing an email.
  const contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    const fields = {
      name: {
        input: document.querySelector("#name"),
        error: document.querySelector("#name-error"),
        validate: (value) => value.trim() ? "" : "Please enter your name."
      },
      email: {
        input: document.querySelector("#email"),
        error: document.querySelector("#email-error"),
        validate: (value) => {
          if (!value.trim()) return "Please enter your email address.";
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : "Enter a valid email address.";
        }
      },
      phone: {
        input: document.querySelector("#phone"),
        error: document.querySelector("#phone-error"),
        validate: (value) => {
          if (!value.trim()) return "Please enter your phone number.";
          return /^\d+$/.test(value.trim()) ? "" : "Use digits only, without spaces or symbols.";
        }
      },
      message: {
        input: document.querySelector("#message"),
        error: document.querySelector("#message-error"),
        validate: (value) => value.trim() ? "" : "Please write a message."
      }
    };
    const status = document.querySelector("#form-status");

    function validateField(field) {
      const message = field.validate(field.input.value);
      field.error.textContent = message;
      field.input.classList.toggle("invalid", Boolean(message));
      field.input.classList.toggle("valid", !message && Boolean(field.input.value.trim()));
      field.input.setAttribute("aria-invalid", String(Boolean(message)));
      return !message;
    }

    Object.values(fields).forEach((field) => {
      field.input.addEventListener("blur", () => validateField(field));
      field.input.addEventListener("input", () => {
        if (field.input.classList.contains("invalid") || field.input.value.trim()) validateField(field);
        status.textContent = "";
        status.classList.remove("error");
      });
    });

    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const valid = Object.values(fields).map(validateField).every(Boolean);
      if (!valid) {
        status.textContent = "Please correct the highlighted fields and try again.";
        status.classList.add("error");
        const firstInvalid = contactForm.querySelector(".invalid");
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const subject = encodeURIComponent(`Message from ${fields.name.input.value.trim()}`);
      const body = encodeURIComponent(
        `Name: ${fields.name.input.value.trim()}\nEmail: ${fields.email.input.value.trim()}\nPhone: ${fields.phone.input.value.trim()}\n\n${fields.message.input.value.trim()}`
      );
      status.textContent = "Your details are valid. Opening your email app with the message ready to send.";
      status.classList.remove("error");
      window.location.href = `mailto:njokutobi@gmail.com?subject=${subject}&body=${body}`;
    });
  }
});

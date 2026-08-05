/**
 * Form field validation helpers
 */
const Validation = (() => {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const PHONE_RE = /^[6-9]\d{9}$/;
  const ROLL_RE = /^[A-Za-z0-9\/\-]{3,30}$/;
  const ENROLL_RE = /^[A-Za-z0-9\/\-]{3,30}$/;

  function isEmpty(value) {
    return value === null || value === undefined || String(value).trim() === '';
  }

  function validateEmail(value) {
    if (isEmpty(value)) return 'Email address is required.';
    const trimmed = String(value).trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) return 'Enter a valid email address.';

    // Reject fake extensions like .png, .jpg, .ci, .ck, etc.
    if (/\.(png|jpg|jpeg|gif|webp|svg|pdf|html|php|js|css|exe|zip|rar)$/i.test(trimmed)) {
      return 'Enter a valid email address (fake image/file extension detected).';
    }

    const parts = trimmed.split('@');
    if (parts.length === 2 && parts[0].length < 2) {
      return 'Email username must be at least 2 characters.';
    }

    return '';
  }

  function validatePhone(value) {
    if (isEmpty(value)) return 'WhatsApp number is required.';
    const digits = String(value).replace(/\D/g, '');
    const normalized = digits.length === 12 && digits.startsWith('91')
      ? digits.slice(2)
      : digits;
    if (!PHONE_RE.test(normalized)) {
      return 'Enter a valid 10-digit Indian mobile number.';
    }
    return '';
  }

  function validateRoll(value) {
    if (isEmpty(value)) return 'University roll number is required.';
    if (!ROLL_RE.test(String(value).trim())) {
      return 'Enter a valid roll number (3–30 characters).';
    }
    return '';
  }

  function validateEnrollment(value) {
    if (isEmpty(value)) return 'College ID (enrollment number) is required.';
    if (!ENROLL_RE.test(String(value).trim())) {
      return 'Enter a valid enrollment number (3–30 characters).';
    }
    return '';
  }

  function validateRequired(value, label) {
    if (isEmpty(value)) return `${label} is required.`;
    return '';
  }

  function validateName(value) {
    if (isEmpty(value)) return 'Full name is required.';
    const trimmed = String(value).trim();
    if (trimmed.length < 2) return 'Name must be at least 2 characters.';
    if (!/^[A-Za-z\s.'\-]+$/.test(trimmed)) {
      return 'Name may only contain letters, spaces, and basic punctuation.';
    }
    return '';
  }

  function validateTeamName(value, registeredTeams = []) {
    if (isEmpty(value)) return { ok: false, message: 'Team name is required.' };
    const trimmed = String(value).trim();
    if (trimmed.length < 2) return { ok: false, message: 'Team name must be at least 2 characters.' };

    const lower = trimmed.toLowerCase();
    if (lower.includes('uit') || lower.includes('united')) {
      return {
        ok: false,
        type: 'institute_name',
        message: 'SIH Rule: Team name must not contain the name of your institute ("United" / "UIT").'
      };
    }

    if (Array.isArray(registeredTeams) && registeredTeams.length > 0) {
      const match = registeredTeams.find(
        (t) => String(t.teamName || '').trim().toLowerCase() === lower
      );
      if (match) {
        return {
          ok: false,
          type: 'duplicate',
          regId: match.registrationId,
          message: `Team name "${trimmed}" is already registered (${match.registrationId}). Please choose a unique team name!`
        };
      }
    }

    return { ok: true, message: `✨ "${trimmed}" is unique & available!` };
  }

  function setFieldError(fieldEl, message) {
    if (!fieldEl) return;
    const input = fieldEl.querySelector('.field-input, .field-select, .radio-group, .checkbox-option');
    const errorEl = fieldEl.querySelector('.field-error');
    const radioGroup = fieldEl.querySelector('.radio-group');
    const checkbox = fieldEl.querySelector('.checkbox-option');

    fieldEl.querySelectorAll('.field-input, .field-select').forEach((el) => {
      el.classList.toggle('invalid', Boolean(message));
      el.setAttribute('aria-invalid', message ? 'true' : 'false');
    });

    if (radioGroup) {
      radioGroup.classList.toggle('invalid', Boolean(message));
    }
    if (checkbox) {
      checkbox.classList.toggle('invalid', Boolean(message));
    }

    if (errorEl) {
      errorEl.textContent = message || '';
      errorEl.classList.toggle('visible', Boolean(message));
    }

    if (input && message) {
      // keep reference for focus later
      input.dataset.hasError = '1';
    }
  }

  function clearFieldError(fieldEl) {
    setFieldError(fieldEl, '');
  }

  function validateField(fieldEl) {
    if (!fieldEl) return true;
    const type = fieldEl.dataset.validate;
    const name = fieldEl.dataset.name;
    let message = '';

    if (type === 'checkbox') {
      const input = fieldEl.querySelector('input[type="checkbox"]');
      if (!input?.checked) {
        message = 'You must accept this declaration to continue.';
      }
      setFieldError(fieldEl, message);
      return !message;
    }

    if (type === 'radio') {
      const checked = fieldEl.querySelector(`input[name="${name}"]:checked`);
      const label = fieldEl.querySelector('.field-label')?.childNodes[0]?.textContent?.trim() || 'This field';
      message = checked ? '' : validateRequired('', label.replace(/\*$/, '').trim());
      setFieldError(fieldEl, message);
      return !message;
    }

    const input = fieldEl.querySelector('.field-input, .field-select');
    if (!input) return true;
    const value = input.value;

    switch (type) {
      case 'name':
        message = validateName(value);
        break;
      case 'teamName': {
        const check = validateTeamName(value, window._registeredTeamsList || []);
        message = check.ok ? '' : check.message;
        break;
      }
      case 'email':
        message = validateEmail(value);
        break;
      case 'phone':
        message = validatePhone(value);
        break;
      case 'roll':
        message = validateRoll(value);
        break;
      case 'enrollment':
        message = validateEnrollment(value);
        break;
      case 'required':
      default: {
        const label = fieldEl.querySelector('.field-label')?.childNodes[0]?.textContent?.trim() || 'This field';
        message = validateRequired(value, label.replace(/\*$/, '').trim());
        break;
      }
    }

    setFieldError(fieldEl, message);
    return !message;
  }

  function validateSection(sectionEl) {
    if (!sectionEl) return true;
    const fields = sectionEl.querySelectorAll('.field[data-validate]');
    let firstInvalid = null;
    let valid = true;

    fields.forEach((field) => {
      const ok = validateField(field);
      if (!ok) {
        valid = false;
        if (!firstInvalid) firstInvalid = field;
      }
    });

    if (firstInvalid) {
      const focusTarget =
        firstInvalid.querySelector('.field-input, .field-select, input[type="radio"], input[type="checkbox"]');
      focusTarget?.focus();
      firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    return valid;
  }

  function normalizePhone(value) {
    const digits = String(value).replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
    return digits;
  }

  return {
    validateField,
    validateSection,
    clearFieldError,
    setFieldError,
    normalizePhone,
    validateEmail,
    validatePhone,
    validateTeamName
  };
})();

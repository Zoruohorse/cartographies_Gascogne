"use strict"; window.CartographyUtils={normalizeText:v=>String(v||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()};

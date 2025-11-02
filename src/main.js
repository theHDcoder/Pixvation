
import './css/styles.css'
import './css/scroll.css'   
import './css/footer.css'
import './css/modal.css'
document.addEventListener('DOMContentLoaded', () => {
    // Build modal once and append to body
    const modal = document.createElement('div');
    modal.className = 'pv-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="pv-modal-overlay"></div>
      <div class="pv-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="pv-modal-title">
        <button class="pv-modal-close" type="button" aria-label="Close">×</button>
        <div class="pv-modal-body">
          <div class="pv-modal-left">
            <img src="" alt="" />
          </div>
          <div class="pv-modal-right">
            <h3 id="pv-modal-title"></h3>
            <p class="pv-modal-desc"></p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  
    const overlay = modal.querySelector('.pv-modal-overlay');
    const closeBtn = modal.querySelector('.pv-modal-close');
    const imgEl = modal.querySelector('.pv-modal-left img');
    const titleEl = modal.querySelector('#pv-modal-title');
    const descEl = modal.querySelector('.pv-modal-desc');
  
    function openModal({ title, desc, imageSrc, imageAlt }) {
      imgEl.src = imageSrc || '';
      imgEl.alt = imageAlt || title || 'Image';
      titleEl.textContent = title || 'Details';
      descEl.textContent = desc || '';
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      modal.setAttribute('aria-hidden', 'false');
    }
  
    function closeModal() {
      modal.classList.remove('open');
      document.body.style.overflow = '';
      modal.setAttribute('aria-hidden', 'true');
    }
  
    overlay.addEventListener('click', closeModal);
    closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  
    // Wire up each card
    document.querySelectorAll('.card').forEach((card) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        // Extract content from existing card structure
        const title = card.querySelector('.card-front .card-title')?.textContent?.trim() || 'Details';
        const descFront = card.querySelector('.card-front .card-description')?.textContent?.trim() || '';
        const descBack = card.querySelector('.card-back p')?.textContent?.trim() || '';
        const desc = [descFront, descBack].filter(Boolean).join(' — ');
        const img = card.querySelector('.card-back .card-image');
        const imageSrc = img?.getAttribute('src') || '';
        const imageAlt = img?.getAttribute('alt') || title;
  
        openModal({ title, desc, imageSrc, imageAlt });
      });
    });
  });
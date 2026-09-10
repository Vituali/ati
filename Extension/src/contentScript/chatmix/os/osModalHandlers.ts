// =================================================================
// MODAL DE O.S — Handlers de eventos internos
// =================================================================

import { SgpData, SgpOccurrenceType } from '../../sgp/types'
import { saveDraft } from './osDraft'
import { processDynamicPlaceholders } from './osModalTypes'

// =================================================================
// SALVAR RASCUNHO AO DIGITAR
// =================================================================

export function setupDraftSaving(chatId: string, osTextArea: HTMLTextAreaElement, modalElement: HTMLElement, getSgpData: () => SgpData | null): void {
  const updateDraftFn = () => {
    saveDraft(chatId, {
      osText: osTextArea.value,
      selectedContract: modalElement.querySelector<HTMLInputElement>('input[name="selected_contract"]:checked')?.value ?? null,
      selectedContractText: modalElement.querySelector<HTMLInputElement>('input[name="selected_contract"]:checked')?.closest('label')?.querySelector('span')?.textContent ?? null,
      occurrenceType: modalElement.querySelector<HTMLInputElement>('#occurrenceTypeSelectedValue')?.value ?? null,
      occurrenceTypeText: modalElement.querySelector<HTMLInputElement>('#occurrenceTypeSearchInput')?.value ?? null,
      sgpData: getSgpData(),
    })
  }

  osTextArea.addEventListener('input', updateDraftFn)

  modalElement.addEventListener('change', (e) => {
    const target = e.target as HTMLElement
    if (target.matches('input[name="selected_contract"]')) {
      updateDraftFn()
    }
  })

  modalElement.addEventListener('input', (e) => {
    const target = e.target as HTMLElement
    if (target.id === 'occurrenceTypeSearchInput') {
      updateDraftFn()
    }
  })

  modalElement.addEventListener('ati:draft-update', updateDraftFn)
}

// =================================================================
// CHECKBOX — Gerar O.S. trava Ocorrência Encerrada
// =================================================================

export function setupOsCheckbox(osCheckbox: HTMLInputElement, statusCheckbox: HTMLInputElement, statusLabel: HTMLElement, modalElement: HTMLElement): void {
  const osFieldsContainer = modalElement.querySelector<HTMLElement>('#modal-os-fields-container')

  const updateVisibility = () => {
    if (osCheckbox.checked) {
      statusCheckbox.checked = false
      statusCheckbox.disabled = true
      statusLabel.classList.add('disabled')
      if (osFieldsContainer) osFieldsContainer.style.display = 'flex'
    } else {
      statusCheckbox.disabled = false
      statusCheckbox.checked = true
      statusLabel.classList.remove('disabled')
      if (osFieldsContainer) osFieldsContainer.style.display = 'none'
    }
  }

  // Executa imediatamente para garantir o estado inicial
  updateVisibility()

  osCheckbox.addEventListener('change', updateVisibility)
}

// =================================================================
// BOTÕES DE TEMPLATE
// =================================================================

export function setupTemplateButtons(modalElement: HTMLElement, osTextArea: HTMLTextAreaElement, osBaseText: string, getOccurrenceTypes: () => SgpOccurrenceType[], _is53?: boolean | (() => boolean)): void {
  modalElement.querySelectorAll<HTMLButtonElement>('.template-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const templateText = btn.getAttribute('data-template-text') ?? ''
      osTextArea.value = processDynamicPlaceholders(osBaseText + templateText).toUpperCase()
      osTextArea.focus()

      // Seleciona tipo de ocorrência automaticamente se template tiver typeId ou typeName
      const typeId35 = btn.getAttribute('data-occurrence-type-id')
      const typeId53 = btn.getAttribute('data-occurrence-type-id-53')
      const typeName = btn.getAttribute('data-occurrence-type-name')

      const searchInput = modalElement.querySelector<HTMLInputElement>('#occurrenceTypeSearchInput')
      const hiddenInput = modalElement.querySelector<HTMLInputElement>('#occurrenceTypeSelectedValue')

      if (searchInput && hiddenInput) {
        const types = getOccurrenceTypes()
        let found: SgpOccurrenceType | undefined

        const normalizeTypeName = (str: string) =>
          str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s*[-–]\s*/g, ' - ')
            .replace(/\s+/g, ' ')
            .trim()

        // 1. Tenta correspondência por ID (35 ou 53)
        if (typeId35 || typeId53) {
          found = types.find((t) => {
            let t35: string | undefined = t.id_35
            let t53: string | undefined = t.id_53
            if (t.id && t.id.startsWith('{')) {
              try {
                const parsed = JSON.parse(t.id)
                t35 = t35 || parsed.id_35
                t53 = t53 || parsed.id_53
              } catch (e) {}
            }
            const match35 = typeId35 && (String(t.id) === String(typeId35) || String(t35) === String(typeId35))
            const match53 = typeId53 && (String(t.id) === String(typeId53) || String(t53) === String(typeId53))
            return match35 || match53
          })
        }

        // 2. Fallback por nome amigável com normalização de hífen/espaços/acentos
        if (!found && typeName) {
          const normTarget = normalizeTypeName(typeName)
          found = types.find((t) => {
            const normText = normalizeTypeName(t.text)
            return normText === normTarget || normText.includes(normTarget) || normTarget.includes(normText)
          })
        }

        if (found) {
          searchInput.value = found.text
          hiddenInput.value = found.id
        } else if (typeName) {
          // Se não encontrou o item exato na lista carregada, define o texto do campo para o fallback de submissão
          searchInput.value = typeName
          hiddenInput.value = ''
        }

        searchInput.dispatchEvent(new CustomEvent('ati:draft-update', { bubbles: true }))
      }
    })
  })
}

// =================================================================
// PERÍODO DE AGENDAMENTO — Campo extra dinâmico
// =================================================================

export function setupPeriodoChangeListener(modalElement: HTMLElement): void {
  const osPeriodoSelect = modalElement.querySelector<HTMLSelectElement>('#osPeriodo')
  const osPeriodoExtraGroup = modalElement.querySelector<HTMLElement>('#osPeriodoExtraGroup')
  const lblPeriodoExtra = modalElement.querySelector<HTMLElement>('#lblPeriodoExtra')
  const osPeriodoExtraInput = modalElement.querySelector<HTMLInputElement>('#osPeriodoExtra')

  if (!osPeriodoSelect || !osPeriodoExtraGroup || !lblPeriodoExtra || !osPeriodoExtraInput) return

  const updatePeriodoExtraVisibility = () => {
    const val = osPeriodoSelect.value
    if (val === 'manha') {
      osPeriodoExtraGroup.style.display = 'flex'
      lblPeriodoExtra.textContent = 'Detalhes do Agendamento (Manhã)'
      osPeriodoExtraInput.placeholder = 'Ex: até as 11, após 10, etc.'
    } else if (val === 'tarde') {
      osPeriodoExtraGroup.style.display = 'flex'
      lblPeriodoExtra.textContent = 'Detalhes do Agendamento (Tarde)'
      osPeriodoExtraInput.placeholder = 'Ex: até as 15, após 14, etc.'
    } else if (val === 'outros') {
      osPeriodoExtraGroup.style.display = 'flex'
      lblPeriodoExtra.textContent = 'Detalhes do Agendamento'
      osPeriodoExtraInput.placeholder = 'Descreva o agendamento personalizado...'
    } else {
      osPeriodoExtraGroup.style.display = 'none'
      osPeriodoExtraInput.value = ''
    }
  }

  // Executa imediatamente para garantir o estado inicial
  updatePeriodoExtraVisibility()

  osPeriodoSelect.addEventListener('change', updatePeriodoExtraVisibility)
}

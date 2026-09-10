;(function () {
  window.addEventListener('message', function handler(event) {
    if (!event.data || (event.data.type !== 'ATI_SGP_FILL' && event.data.type !== 'ATI_SGP_FILL_OS')) return
    window.removeEventListener('message', handler)

    const type = event.data.type
    const data = event.data.data
    const username = event.data.username
    const fullname = event.data.fullname || ''

    function setValue(selector, value) {
      try {
        const el = document.querySelector(selector)
        if (!el) return
        el.value = value
        el.dispatchEvent(new Event('change', { bubbles: true }))
        if (typeof window.jQuery !== 'undefined') {
          window.jQuery(el).trigger('change')
        }
      } catch(e) {}
    }

    function setValueMultiple(selector, values) {
      try {
        const el = document.querySelector(selector)
        if (!el) return
        const valArray = Array.isArray(values) ? values.map(String) : []
        Array.from(el.options).forEach(function(opt) {
          opt.selected = valArray.includes(String(opt.value))
        })
        el.dispatchEvent(new Event('change', { bubbles: true }))
        if (typeof window.jQuery !== 'undefined') {
          window.jQuery(el).trigger('change')
        }
      } catch(e) {}
    }

    function setCheck(selector, checked) {
      try {
        const el = document.querySelector(selector)
        if (!el) return
        el.checked = checked
        el.dispatchEvent(new Event('change', { bubbles: true }))
        if (typeof window.jQuery !== 'undefined') {
          window.jQuery(el).trigger('change')
        }
      } catch(e) {}
    }

    function toggleSgpAuxGroup(responsavelSelect) {
      const selectedOption = responsavelSelect.options[responsavelSelect.selectedIndex]
      const isPlantonista = selectedOption ? selectedOption.textContent.toLowerCase().includes('plantonista') : false
      const tecnicosEl = document.querySelector('#id_tecnicos')
      if (tecnicosEl) {
        const row = tecnicosEl.closest('.form-row') || tecnicosEl.parentElement
        if (row) {
          row.style.display = isPlantonista ? 'none' : ''
        }
      }
    }

    function norm(str) {
      return str.toLowerCase().trim().replace(/\s+/g, ' ')
    }

    function noAccent(str) {
      return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    }

    function stripPrefix(str) {
      return str.replace(/^(?:suporte|tecnico|adm|financeiro|comercial|rh|ceo)[_\s\d-–]*[-–]\s*/i, '').trim()
    }

    function matches(optionText, searchTerm) {
      const t = norm(optionText)
      const s = norm(searchTerm)
      return t === s || noAccent(t) === noAccent(s)
    }

    function showError(message) {
      console.error('ATI: ' + message)
      var errDiv = document.createElement('div')
      errDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#dc3545;color:#fff;padding:12px 20px;z-index:999999;font-weight:bold;text-align:center;font-size:14px;font-family:sans-serif;box-shadow:0 2px 10px rgba(0,0,0,0.3)'
      errDiv.textContent = 'ATI: ' + message
      document.body.appendChild(errDiv)
      setTimeout(function() { errDiv.remove() }, 10000)
    }

    function fill() {
      const now = new Date()
      const pad = function(n) { return String(n).padStart(2, '0') }
      const dateStr = pad(now.getDate()) + '/' + pad(now.getMonth()+1) + '/' + now.getFullYear() + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds())

      // Responsável por texto / Usuário Responsável
      if (username || fullname) {
        var respSelect = document.querySelector('#id_responsavel')
        if (respSelect) {
          var options = Array.from(respSelect.options).filter(function(o) { return o.value })
          var targetOption = null
          var cleanUser = norm(username)
          var cleanFullname = norm(fullname)
          var noAccentFullname = noAccent(cleanFullname)

          // Passo 1: Match por código de usuário exato (ex: \bsuporte_05\b)
          if (username) {
            var isUserCode = /^(?:suporte|tecnico|adm|financeiro|comercial|rh|ceo)[\s_-]?\d+$/i.test(username)
            var codeRegex = new RegExp('(?:^|[^a-zA-Z0-9])' + username.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '(?:$|[^a-zA-Z0-9])', 'i')
            targetOption = options.find(function(o) {
              return isUserCode ? codeRegex.test(o.textContent) : matches(o.textContent, username)
            })
          }

          // Passo 2: Match por nome completo contido na opção (ex: "suporte_05 - VICTOR HENRIQUE DE OLIVEIRA")
          if (!targetOption && fullname && cleanFullname.length > 3) {
            targetOption = options.find(function(o) {
              var text = norm(o.textContent)
              var textNoAccent = noAccent(text)
              return textNoAccent.includes(noAccentFullname)
            })
          }

          // Passo 3: Match exato no texto sem prefixo
          if (!targetOption && username) {
            targetOption = options.find(function(o) { return matches(stripPrefix(o.textContent), username) })
          }
          if (!targetOption && fullname) {
            targetOption = options.find(function(o) { return matches(stripPrefix(o.textContent), fullname) })
          }

          // Passo 4: Fallback por pontuação de tokens do nome
          if (!targetOption) {
            var genericDeptRegex = /^(suporte|tecnico|adm|financeiro|comercial|rh|ceo)$/i
            var userWords = username ? username.split(/[^a-zA-Z0-9\u00C0-\u00FF]+/).filter(function(w) { return w.length > 1 && !genericDeptRegex.test(w) }) : []
            var nameWords = fullname ? norm(fullname).split(/\s+/).filter(function(w) { return w.length > 2 }) : []
            var bestScore = -1

            options.forEach(function(o) {
              var text = norm(o.textContent)
              var textNoAccent = noAccent(text)
              var score = 0

              var matchedNameCount = 0
              nameWords.forEach(function(word) {
                if (text.includes(word) || textNoAccent.includes(noAccent(word))) {
                  matchedNameCount++
                  score += 100
                }
              })

              if (nameWords.length > 0 && matchedNameCount === nameWords.length) {
                score += 1000
              }

              userWords.forEach(function(word) {
                if (text.includes(word)) score += 200
              })

              if (score > 0 && score > bestScore) {
                bestScore = score
                targetOption = o
              }
            })
          }

          if (targetOption) {
            console.log('ATI: Usuário Responsável selecionado: ' + targetOption.textContent)
            setValue('#id_responsavel', targetOption.value)
          } else {
            showError('Técnico "' + (username || fullname || 'desconhecido') + '" não encontrado na lista. Selecione manualmente.')
          }
        }
      }

      // Fixos
      const setorSelect = document.querySelector('#id_setor')
      let sectorValue = '2'
      if (setorSelect) {
        const has53Sector = Array.from(setorSelect.options).some(function(o) {
          return o.value === '100006'
        })
        if (has53Sector) {
          sectorValue = '100006'
        }
      } else {
        if (window.location.href.includes('201.158.20.53')) {
          sectorValue = '100006'
        }
      }
      setValue('#id_setor', sectorValue)
      setValue('#id_metodo', '3')
      
      let occDateStr = dateStr
      if (data.osDateModified && data.osDataAgendamento) {
        const parts = data.osDataAgendamento.split('-')
        if (parts.length === 3) {
          const yyyy = parts[0]
          const mm = parts[1]
          const dd = parts[2]
          
          const nowTime = new Date()
          const timeStr = pad(nowTime.getHours()) + ':' + pad(nowTime.getMinutes()) + ':' + pad(nowTime.getSeconds())
          occDateStr = dd + '/' + mm + '/' + yyyy + ' ' + timeStr
        }
      }
      setValue('#id_data_agendamento', occDateStr)

      // Contrato
      function setContract() {
        if (data.selectedContract) {
          setValue('#id_clientecontrato', data.selectedContract)
          return
        }

        const contractSelect = document.querySelector('#id_clientecontrato')
        if (!contractSelect || contractSelect.value !== '') return
        
        const opts = Array.from(contractSelect.options).filter(function(o) {
          return o.value && !o.text.includes('CANCELADO')
        })
        if (opts.length === 1) setValue('#id_clientecontrato', opts[0].value)
      }
      setContract()

      // Descrição e tipo
      if (data.osText) setValue('#id_conteudo', data.osText.toUpperCase())

      var tipoSelect = document.querySelector('#id_tipo')
      if (tipoSelect) {
        var filledType = false
        if (data.occurrenceType) {
          setValue('#id_tipo', data.occurrenceType)
          if (String(tipoSelect.value) === String(data.occurrenceType)) {
            filledType = true
          }
        }

        // Fallback por nome caso a seleção por ID não funcione ou esteja vazia
        if (!filledType && data.occurrenceTypeText) {
          var cleanSearchType = noAccent(norm(data.occurrenceTypeText))
          var opt = Array.from(tipoSelect.options).find(function(o) {
            var optTextClean = noAccent(norm(o.textContent))
            return optTextClean === cleanSearchType || optTextClean.includes(cleanSearchType)
          })
          if (opt) {
            console.log('ATI: Tipo de ocorrência selecionado pelo nome: ' + opt.textContent)
            setValue('#id_tipo', opt.value)
          }
        }
      }

      // OS e status
      if (data.shouldCreateOS) {
        setCheck('#id_os', true)
      } else {
        setCheck('#id_os', false)
        if (data.occurrenceStatus === '1') setValue('#id_status', '1')
      }

      console.log('ATI: Formulário de ocorrência preenchido!')
    }

    function fillOS() {
      if (data.motivo) {
        setValue('#id_motivoos', data.motivo)
        setValue('#id_motivo', data.motivo)
      }

      if (data.prioridade) {
        setValue('#id_prioridade', data.prioridade)
      }

      // Ajusta data agendamento conforme o período
      let dateStr = ''
      let hour = '09:00:00'
      if (data.periodo === 'tarde') hour = '13:00:00'
      else if (data.periodo === 'manha') hour = '09:00:00'
      else if (data.periodo === '48h') hour = '09:00:00'
      else if (data.periodo === 'outros') hour = '09:00:00'

      if (data.dataAgendamento) {
        const parts = data.dataAgendamento.split('-')
        if (parts.length === 3) {
          const yyyy = parts[0]
          const mm = parts[1]
          const dd = parts[2]
          dateStr = dd + '/' + mm + '/' + yyyy + ' ' + hour
        }
      }

      if (!dateStr) {
        const now = new Date()
        const pad = function(n) { return String(n).padStart(2, '0') }
        dateStr = pad(now.getDate()) + '/' + pad(now.getMonth()+1) + '/' + now.getFullYear() + ' ' + hour
      }

      setValue('#id_data_agendamento', dateStr)

      if (data.responsavel) {
        setValue('#id_responsavel', data.responsavel)
      }

      if (data.tecnicos) {
        setValueMultiple('#id_tecnicos', data.tecnicos)
      }

      // Adiciona o listener e faz o toggle inicial de exibição dos auxiliares no formulário do SGP
      const respSelect = document.querySelector('#id_responsavel')
      if (respSelect) {
        respSelect.addEventListener('change', function() {
          toggleSgpAuxGroup(respSelect)
        })
        toggleSgpAuxGroup(respSelect)
      }

      // Observação prefixada com o período de agendamento selecionado
      let prefix = ''
      if (data.periodo === '48h') {
        prefix = '[PRAZO DE 48 HORAS]'
      } else if (data.periodo === 'manha') {
        if (data.periodoExtra && data.periodoExtra.trim()) {
          prefix = '[AGENDAMENTO: MANHÃ - ' + data.periodoExtra.trim() + ']'
        } else {
          prefix = '[AGENDAMENTO: MANHÃ]'
        }
      } else if (data.periodo === 'tarde') {
        if (data.periodoExtra && data.periodoExtra.trim()) {
          prefix = '[AGENDAMENTO: TARDE - ' + data.periodoExtra.trim() + ']'
        } else {
          prefix = '[AGENDAMENTO: TARDE]'
        }
      } else if (data.periodo === 'outros') {
        if (data.periodoExtra && data.periodoExtra.trim()) {
          prefix = '[AGENDAMENTO: ' + data.periodoExtra.trim() + ']'
        } else {
          prefix = '[AGENDAMENTO: OUTROS]'
        }
      }

      let finalObs = ''
      if (prefix) {
        finalObs = prefix
        if (data.observacao) {
          finalObs += ' ' + data.observacao
        }
      } else {
        finalObs = data.observacao || ''
      }

      setValue('#id_observacao', finalObs)
      setValue('#id_observacoes', finalObs)

      console.log('ATI: Formulário de O.S. preenchido!')
    }

    function waitAndFill(attempts) {
      if (document.querySelector('#id_clientecontrato')) {
        fill()
        return
      }
      
      if (attempts >= 30) {
        console.error('ATI: Formulário não encontrado após 9s.')
        return
      }
      
      setTimeout(function() { waitAndFill(attempts + 1) }, 300)
    }

    function waitAndFillOS(attempts) {
      if (document.querySelector('#id_motivoos') || document.querySelector('#id_motivo') || document.querySelector('#id_responsavel')) {
        fillOS()
        return
      }
      
      if (attempts >= 30) {
        console.error('ATI: Formulário de O.S. não encontrado após 9s.')
        return
      }
      
      setTimeout(function() { waitAndFillOS(attempts + 1) }, 300)
    }

    if (type === 'ATI_SGP_FILL') {
      waitAndFill(0)
    } else if (type === 'ATI_SGP_FILL_OS') {
      waitAndFillOS(0)
    }
  })
})()
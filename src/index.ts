function Scrollio(scrollioEl: HTMLElement = document.body) {
  let ticking = false

  scrollioEvent(scrollioEl)

  window.addEventListener('load', () => {
    scrollioEvent(scrollioEl)
  })

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        ticking = false
        scrollioEvent(scrollioEl)
      })
      ticking = true
    }
  }, false)
}

function scrollioEvent(scrollioEl: HTMLElement) {
  scrollioEl.querySelectorAll<HTMLElement>('.scrollio').forEach(element => {
    const cssProperties: { [index: string]: { position: number, value: string }[] } = createParallaxObjects(element) || {
      transform: [
        { position: 0, value: 'translateY(-30px)' },
        { position: 100, value: 'translateY(30px)' }
      ]
    }
    const current = window.pageYOffset
    const start = element.getBoundingClientRect().top + window.pageYOffset - window.innerHeight
    const end = element.getBoundingClientRect().bottom + window.pageYOffset
    for (const prop in cssProperties) {
      const cssProperty = cssProperties[prop]
      const percentage = scaleValue(current, [start, end], [0, 100])
      const positions = cssProperty.map(obj => obj.position)
      if (percentage <= positions[0]) {
        // Bottom out
        element.style.setProperty(prop, cssProperty[0].value)
      }
      else if (percentage >= positions[positions.length - 1]) {
        // Top out
        element.style.setProperty(prop, cssProperty[cssProperty.length - 1].value)
      }
      else {
        // In Between
        for (let i = 0; i < positions.length - 1; i++) {
          if (percentage >= positions[i] && percentage <= positions[i + 1]) {
            const startNumbers = cssProperty[i].value.match(/-?\d+\.?\d*/g)
            const endNumbers = cssProperty[i + 1].value.match(/-?\d+\.?\d*/g)
            if (startNumbers && endNumbers && startNumbers.length === endNumbers.length) {
              let c = -1
              const newValue = cssProperty[i].value.replace(/-?\d+\.?\d*/g, () => {
                c++
                return String(scaleValue(
                  percentage,
                  [positions[i], positions[i + 1]],
                  [Number(startNumbers[c]), Number(endNumbers[c])]
                ))
              })
              element.style.setProperty(prop, newValue)
            }
          }
        }
      }
    }
  })
}

function createParallaxObjects(element: HTMLElement) {
  const parallaxProperties: { position: number, name: string, value: string }[] = []
  for (let i = 0; i < element.attributes.length; i++) {
    const attribute = element.attributes[i]
    if (attribute.name.substring(0, 14) === 'data-scrollio-') {
      const propertyValuePairs = attribute.value.split(';')
      propertyValuePairs.forEach(propertyValuePair => {
        const [property, value] = propertyValuePair.trim().split(':')
        if (typeof property !== 'undefined' && typeof value !== 'undefined') {
          parallaxProperties.push({
            position: Number(attribute.name.substring(14)),
            name: property.trim(),
            value: value.trim()
          })
        }
      })
    }
  }
  const parallax: { [index: string]: { position: number, value: string }[] } = {}
  parallaxProperties.forEach(property => {
    parallax[property.name] = parallax[property.name] || []
    parallax[property.name].push({
      position: property.position,
      value: property.value
    })
  })
  for (const prop in parallax) {
    if (parallax[prop].length < 2) {
      console.error(`Error: ${prop} must have at least 2 value targets`)
      delete parallax[prop]
    }
    parallax[prop].sort((a, b) => a.position - b.position)
  }
  return Object.keys(parallax).length === 0 ? false : parallax
}

function scaleValue(
  value: number,
  from: number[],
  to: number[]
) {
  const scale = (to[1] - to[0]) / (from[1] - from[0])
  const capped = Math.min(from[1], Math.max(from[0], value)) - from[0]
  return capped * scale + to[0]
}

export default Scrollio
export { scrollioEvent }

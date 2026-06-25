import { useEffect, useState } from 'react'
import { getHistory } from '../lib/api'
import { formatDate } from '../lib/dates'
import type { DailyLine, HistoryRecord, Product } from '../types/domain'

type HistoryLine = DailyLine & { products: Pick<Product, 'name' | 'sort_order'> | null }

function getStockThreshold(productName: string) {
  const name = productName.toLowerCase()

  if (name.includes('entera normal') || name.includes('entera integral')) return 20
  if (name.includes('media normal') || name.includes('media integral')) return 30
  if (name.includes('bollito') || name.includes('semilla') || name.includes('centeno')) return 15
  return null
}

function needsOrder(line: HistoryLine) {
  const threshold = getStockThreshold(line.products?.name ?? '')
  return threshold !== null && line.warehouse_stock_after < threshold
}

function buildWhatsappText(record: HistoryRecord, lines: HistoryLine[]) {
  const alerts = lines.filter(needsOrder)
  const detail = lines
    .map((line) => {
      const name = line.products?.name ?? 'Producto eliminado'
      const threshold = getStockThreshold(name)
      const alert = threshold !== null && line.warehouse_stock_after < threshold ? ' *' : ''

      return `${name}: vendidos ${line.breakfast_consumed}, sobran ${line.final_leftover}, stock ${line.warehouse_stock_after}${alert}`
    })
    .join('\n')

  const alertText = alerts.length > 0
    ? `\n\nPedir: ${alerts
        .map((line) => {
          return `${line.products?.name ?? 'Producto eliminado'} (${line.warehouse_stock_after})`
        })
        .join(', ')}`
    : ''

  return `Desayunos ${formatDate(record.record_date)}\nDesayunos vendidos: ${record.breakfast_total}\n\n${detail}${alertText}`
}

async function createReportImage(record: HistoryRecord, lines: HistoryLine[]) {
  const scale = 2
  const width = 760
  const rowHeight = 58
  const headerHeight = 182
  const alertHeight = lines.some(needsOrder) ? 58 : 0
  const height = headerHeight + rowHeight * (lines.length + 1) + alertHeight + 34
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const context = canvas.getContext('2d')

  if (!context) throw new Error('No se pudo crear la imagen.')

  context.scale(scale, scale)
  context.fillStyle = '#fff8ed'
  context.fillRect(0, 0, width, height)
  context.fillStyle = '#2b1708'
  context.font = '700 30px Arial'
  context.fillText('Resumen desayunos', 28, 44)
  context.font = '700 22px Arial'
  context.fillText(formatDate(record.record_date), 28, 78)
  context.fillStyle = '#8a3d08'
  context.fillRect(28, 96, width - 56, 58)
  context.fillStyle = '#fff8ed'
  context.font = '700 24px Arial'
  context.fillText('Desayunos vendidos', 48, 132)
  context.font = '700 42px Arial'
  context.fillText(String(record.breakfast_total), 610, 137)

  const columns = [28, 310, 430, 575]
  let y = headerHeight

  context.fillStyle = '#2b1708'
  context.fillRect(18, y - 40, width - 36, 50)
  context.fillStyle = '#fff8ed'
  context.font = '700 18px Arial'
  context.fillText('Pan', columns[0], y - 10)
  context.fillText('Vendidos', columns[1], y - 10)
  context.fillText('Sobrante', columns[2], y - 10)
  context.fillText('Stock', columns[3], y - 10)

  y += 72
  context.font = '700 20px Arial'

  for (const line of lines) {
    const lowStock = needsOrder(line)
    const name = line.products?.name ?? 'Producto eliminado'

    context.fillStyle = lowStock ? '#ffe1dd' : '#fffdf8'
    context.fillRect(18, y - 30, width - 36, 48)
    context.strokeStyle = '#ead8bd'
    context.strokeRect(18, y - 30, width - 36, 48)
    context.fillStyle = '#2b1708'
    context.fillText(lowStock ? `${name} *` : name, columns[0], y)
    context.fillText(String(line.breakfast_consumed), columns[1], y)
    context.fillText(String(line.final_leftover), columns[2], y)
    context.fillText(String(line.warehouse_stock_after), columns[3], y)
    y += rowHeight
  }

  const alerts = lines.filter(needsOrder)
  if (alerts.length > 0) {
    context.fillStyle = '#b42318'
    context.font = '700 18px Arial'
    context.fillText(`* Pedir: ${alerts.map((line) => `${line.products?.name ?? 'Producto'} (${line.warehouse_stock_after})`).join(', ')}`, 28, y + 5)
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('No se pudo generar la imagen.'))
    }, 'image/png')
  })

  return new File([blob], `desayunos-${record.record_date}.png`, { type: 'image/png' })
}

async function shareByWhatsapp(record: HistoryRecord, lines: HistoryLine[]) {
  try {
    const file = await createReportImage(record, lines)

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Resumen desayunos', text: `Desayunos ${formatDate(record.record_date)}` })
      return
    }
  } catch {
    // Si compartir imagen no esta disponible, usamos texto compacto.
  }

  const text = encodeURIComponent(buildWhatsappText(record, lines))
  window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer')
}

export function HistoryScreen({ onEditDay }: { onEditDay: (date: string) => void }) {
  const [records, setRecords] = useState<HistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        setRecords(await getHistory())
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'No se pudo cargar el historial.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  if (loading) {
    return <div className="rounded-3xl bg-white/70 p-5 font-bold text-amber-950">Cargando historial...</div>
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-800">Consulta</p>
        <h2 className="text-3xl font-black tracking-tight">Historial</h2>
      </div>

      {error && <div className="rounded-2xl bg-red-100 p-4 text-sm font-bold text-red-800">{error}</div>}

      {records.length === 0 && !error && (
        <div className="rounded-3xl bg-white/70 p-5 text-sm font-bold text-stone-700">
          Todavia no hay registros guardados.
        </div>
      )}

      {records.map((record) => {
        const lines = [...record.daily_breakfast_lines].sort(
          (a, b) => (a.products?.sort_order ?? 0) - (b.products?.sort_order ?? 0),
        )
        const alerts = lines.filter(needsOrder)

        return (
          <details key={record.id} className="rounded-[1.75rem] bg-[#fffaf2] p-4 shadow-sm ring-1 ring-amber-950/5">
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-black">{formatDate(record.record_date)}</h3>
                  <p className="text-sm font-bold text-stone-600">Desayunos vendidos: {record.breakfast_total}</p>
                  {alerts.length > 0 && (
                    <p className="mt-1 text-sm font-black text-red-700">{alerts.length} alerta(s) de pedido</p>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black ${record.closed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
                  {record.closed ? 'Cerrado' : 'Abierto'}
                </span>
              </div>
            </summary>

            <div className="mt-4 rounded-2xl bg-amber-950 p-4 text-amber-50">
              <p className="text-xs font-black uppercase tracking-wide text-amber-200">Resumen del dia</p>
              <p className="mt-1 text-2xl font-black">{record.breakfast_total} desayunos vendidos</p>
              <p className="text-sm font-bold text-amber-100">Fecha: {formatDate(record.record_date)}</p>
            </div>

            {alerts.length > 0 && (
              <div className="mt-3 rounded-2xl bg-red-100 p-4 text-red-900">
                <p className="font-black">Alerta de pedir producto</p>
                <div className="mt-2 space-y-1 text-sm font-bold">
                  {alerts.map((line) => {
                    const name = line.products?.name ?? 'Producto eliminado'
                    return (
                      <p key={line.id}>
                        {name}: stock {line.warehouse_stock_after}
                      </p>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mt-4 space-y-3">
              {lines.map((line) => (
                <div key={line.id} className="rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-900/5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-black text-stone-950">{line.products?.name ?? 'Producto eliminado'}</p>
                    {needsOrder(line) && <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-black text-red-800">Pedir</span>}
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-sm font-bold text-stone-700">
                    <span>Usados: {line.breakfast_consumed}</span>
                    <span>Sobraron: {line.final_leftover}</span>
                    <span>Stock: {line.warehouse_stock_after}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => shareByWhatsapp(record, lines)}
              className="mt-4 w-full rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white"
            >
              Compartir por WhatsApp
            </button>
            <button
              type="button"
              onClick={() => onEditDay(record.record_date)}
              className="mt-2 w-full rounded-2xl bg-amber-950 px-4 py-3 font-black text-amber-50"
            >
              Editar dia
            </button>
          </details>
        )
      })}
    </section>
  )
}

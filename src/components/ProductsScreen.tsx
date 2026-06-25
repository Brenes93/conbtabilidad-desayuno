import { useEffect, useState } from 'react'
import { getProducts, saveProduct, setProductActive } from '../lib/api'
import type { Product } from '../types/domain'

export function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([])
  const [name, setName] = useState('')
  const [sortOrder, setSortOrder] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      setProducts(await getProducts(true))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los productos.')
    } finally {
      setLoading(false)
    }
  }

  function edit(product: Product) {
    setEditingId(product.id)
    setName(product.name)
    setSortOrder(String(product.sort_order))
    setMessage(null)
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setSortOrder('')
  }

  async function submit() {
    if (!name.trim()) {
      setError('El nombre del producto es obligatorio.')
      return
    }

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      await saveProduct({
        id: editingId ?? undefined,
        name,
        sort_order: Number(sortOrder) || products.length * 10 + 10,
      })
      setMessage(editingId ? 'Producto actualizado.' : 'Producto anadido.')
      resetForm()
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo guardar el producto.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(product: Product) {
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      await setProductActive(product.id, !product.active)
      setMessage(product.active ? 'Producto desactivado.' : 'Producto activado.')
      await load()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cambiar el producto.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="rounded-3xl bg-white/70 p-5 font-bold text-amber-950">Cargando productos...</div>
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.25em] text-amber-800">Configuracion</p>
        <h2 className="text-3xl font-black tracking-tight">Productos</h2>
      </div>

      {error && <div className="rounded-2xl bg-red-100 p-4 text-sm font-bold text-red-800">{error}</div>}
      {message && <div className="rounded-2xl bg-emerald-100 p-4 text-sm font-bold text-emerald-800">{message}</div>}

      <div className="rounded-[1.75rem] bg-[#fffaf2] p-4 shadow-sm ring-1 ring-amber-950/5">
        <h3 className="text-lg font-black">{editingId ? 'Editar producto' : 'Anadir producto'}</h3>
        <div className="mt-4 grid gap-3">
          <label>
            <span className="field-label">Nombre</span>
            <input className="number-input" value={name} onChange={(event) => setName(event.target.value)} />
          </label>
          <label>
            <span className="field-label">Orden</span>
            <input
              className="number-input"
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              placeholder="10, 20, 30..."
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={submit}
              className="rounded-2xl bg-amber-950 px-4 py-3 font-black text-amber-50 disabled:opacity-50"
            >
              Guardar
            </button>
            <button type="button" onClick={resetForm} className="rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-950">
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {products.map((product) => (
          <article key={product.id} className="rounded-3xl bg-white/75 p-4 ring-1 ring-amber-950/5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-black">{product.name}</h3>
                <p className="text-sm font-bold text-stone-600">Orden {product.sort_order}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${product.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-700'}`}>
                {product.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => edit(product)} className="rounded-2xl bg-amber-100 px-4 py-3 font-black text-amber-950">
                Editar
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => toggleActive(product)}
                className="rounded-2xl bg-stone-900 px-4 py-3 font-black text-white disabled:opacity-50"
              >
                {product.active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

'use client';

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { AlertCircle, Check, ChevronDown, ImagePlus, LoaderCircle, Plus, Trash2, X } from 'lucide-react';
import { Product, ProductColor, ProductImage, ProductInput, api } from '@/lib/api';

type EditorState = {
  name: string;
  category: string;
  description: string;
  price: string;
  stock: string;
  sizes: string[];
  model3DUrl: string;
  model3DPublicId: string;
  isNewArrival: boolean;
  isFeatured: boolean;
  images: Array<{ url: string; public_id: string }>;
  colors: Array<{ name: string; hex: string }>;
  discount: string;
  discountEndsAt: string;
};

const EMPTY_COLOR = { name: '', hex: '#000000' };
const DEFAULT_CATEGORY_OPTIONS = ['T-Shirts', 'Hoodies', 'Pants', 'Accessories', 'Footwear'];
const DEFAULT_SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'];

function createInitialState(product?: Product | null): EditorState {
  return {
    name: product?.name ?? '',
    category: product?.category ?? '',
    description: product?.description ?? '',
    price: product ? String(product.price) : '',
    stock: product ? String(product.stock) : '',
    sizes: product?.sizes ?? [],
    model3DUrl: product?.model3D?.url ?? '',
    model3DPublicId: product?.model3D?.public_id ?? '',
    isNewArrival: product?.isNewArrival ?? false,
    isFeatured: product?.isFeatured ?? false,
    discount: product?.discount ? String(product.discount) : '',
    discountEndsAt: product?.discountEndsAt
      ? new Date(product.discountEndsAt).toISOString().slice(0, 16)
      : '',
    images: product?.images?.length
      ? product.images.map((image) => ({
          url: image.url,
          public_id: image.public_id ?? '',
        }))
      : [],
    colors: product?.colors?.length
      ? product.colors.map((color) => ({
          name: color.name,
          hex: color.hex,
        }))
      : [EMPTY_COLOR],
    };
}

function normalizeImages(images: EditorState['images']): ProductImage[] {
  return images
    .map((image) => ({
      url: image.url.trim(),
      public_id: image.public_id.trim() || undefined,
    }))
    .filter((image) => image.url);
}

function normalizeColors(colors: EditorState['colors']): ProductColor[] {
  return colors
    .map((color) => ({
      name: color.name.trim(),
      hex: color.hex.trim(),
    }))
    .filter((color) => color.name && color.hex);
}

function validateHexColor(value: string) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value);
}

function buildPayload(state: EditorState): ProductInput {
  const name = state.name.trim();
  const category = state.category.trim();
  const description = state.description.trim();
  const price = Number(state.price);
  const stock = Number(state.stock);
  const sizes = state.sizes.map((size) => size.trim()).filter(Boolean);
  const images = normalizeImages(state.images);
  const colors = normalizeColors(state.colors);
  const model3DUrl = state.model3DUrl.trim();
  const model3DPublicId = state.model3DPublicId.trim();

  if (!name || !category || !description) {
    throw new Error('Name, category, and description are required.');
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error('Price must be a valid number greater than or equal to 0.');
  }

  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error('Stock must be a whole number greater than or equal to 0.');
  }

  if (images.length === 0) {
    throw new Error('Upload at least one product image.');
  }

  if (colors.some((color) => !validateHexColor(color.hex))) {
    throw new Error('Every color must use a valid hex code such as #111111.');
  }

  return {
    name,
    category,
    description,
    price,
    stock,
    sizes,
    colors,
    images,
    model3D: model3DUrl
      ? {
          url: model3DUrl,
          ...(model3DPublicId ? { public_id: model3DPublicId } : {}),
        }
      : null,
    isNewArrival: state.isNewArrival,
    isFeatured: state.isFeatured,
    discount: state.discount !== '' ? Number(state.discount) : 0,
    discountEndsAt: state.discountEndsAt ? new Date(state.discountEndsAt).toISOString() : null,
  };
}

interface ProductEditorProps {
  product?: Product | null;
  categoryOptions?: string[];
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: ProductInput) => Promise<void>;
}

export default function ProductEditor({
  product,
  categoryOptions = [],
  saving,
  onClose,
  onSubmit,
}: ProductEditorProps) {
  const [form, setForm] = useState<EditorState>(() => createInitialState(product));
  const [error, setError] = useState('');
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [sizesOpen, setSizesOpen] = useState(false);
  const sizesDropdownRef = useRef<HTMLDivElement | null>(null);

  const title = useMemo(() => (product ? 'Edit Product' : 'New Product'), [product]);
  const resolvedCategoryOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...DEFAULT_CATEGORY_OPTIONS,
          ...categoryOptions,
          ...(product?.category ? [product.category] : []),
        ].map((value) => value.trim()).filter(Boolean))
      ).sort((left, right) => left.localeCompare(right)),
    [categoryOptions, product?.category]
  );
  const resolvedSizeOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...DEFAULT_SIZE_OPTIONS,
          ...form.sizes,
          ...(product?.sizes ?? []),
        ].map((value) => value.trim()).filter(Boolean))
      ),
    [form.sizes, product?.sizes]
  );
  const sizesSummary = useMemo(
    () => (form.sizes.length > 0 ? form.sizes.join(', ') : 'Select sizes'),
    [form.sizes]
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!sizesOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!sizesDropdownRef.current?.contains(event.target as Node)) {
        setSizesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sizesOpen]);

  const updateColor = (index: number, key: 'name' | 'hex', value: string) => {
    setForm((current) => ({
      ...current,
      colors: current.colors.map((color, colorIndex) =>
        colorIndex === index ? { ...color, [key]: value } : color
      ),
    }));
  };

  const removeImage = (index: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const toggleSize = (size: string) => {
    setForm((current) => ({
      ...current,
      sizes: current.sizes.includes(size)
        ? current.sizes.filter((entry) => entry !== size)
        : [...current.sizes, size],
    }));
  };

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) {
      return;
    }

    setUploadError('');
    setUploadingImages(true);

    try {
      const uploadedImages = await Promise.all(files.map((file) => api.uploadProductImage(file)));

      setForm((current) => ({
        ...current,
        images: [
          ...current.images,
          ...uploadedImages.map((image) => ({
            url: image.url,
            public_id: image.public_id ?? '',
          })),
        ],
      }));
    } catch (uploadingError) {
      setUploadError(uploadingError instanceof Error ? uploadingError.message : 'Unable to upload image.');
    } finally {
      setUploadingImages(false);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');

    try {
      const payload = buildPayload(form);
      await onSubmit(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save product.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] bg-[#14001f]/70 backdrop-blur-sm">
      <div className="h-full w-full overflow-y-auto">
        <div className="ml-auto min-h-full w-full max-w-3xl bg-[#f7f2fb] text-[#2b173d] shadow-[0_30px_80px_rgba(0,0,0,0.42)]">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e2d5ef] bg-[#f7f2fb]/95 px-6 py-5 backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7a5a97]">Admin</p>
              <h2 className="text-2xl font-black">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#decfea] text-[#5d3a7d] transition-colors hover:border-[#7A1FA2] hover:text-[#7A1FA2]"
              aria-label="Close editor"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8 px-6 py-6 pb-10">
            {error && (
              <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <section className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Product Name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-[#d7c7e7] bg-white px-4 py-3 outline-none transition-colors focus:border-[#7A1FA2]"
                  placeholder="Seven Classic Tee"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Category</span>
                <select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className="w-full appearance-none rounded-2xl border border-[#d7c7e7] bg-white px-4 py-3 outline-none transition-colors focus:border-[#7A1FA2]"
                >
                  <option value="">Select category</option>
                  {resolvedCategoryOptions.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  className="w-full rounded-2xl border border-[#d7c7e7] bg-white px-4 py-3 outline-none transition-colors focus:border-[#7A1FA2]"
                  placeholder="85"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">Stock</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))}
                  className="w-full rounded-2xl border border-[#d7c7e7] bg-white px-4 py-3 outline-none transition-colors focus:border-[#7A1FA2]"
                  placeholder="24"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Description</span>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                  rows={5}
                  className="w-full rounded-3xl border border-[#d7c7e7] bg-white px-4 py-3 outline-none transition-colors focus:border-[#7A1FA2]"
                  placeholder="Describe the fit, fabric, and details."
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold">Sizes</span>
                <div ref={sizesDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setSizesOpen((current) => !current)}
                    className="flex w-full items-center justify-between rounded-2xl border border-[#d7c7e7] bg-white px-4 py-3 text-left outline-none transition-colors hover:border-[#7A1FA2] focus:border-[#7A1FA2]"
                  >
                    <span className={form.sizes.length > 0 ? 'text-[#2b173d]' : 'text-[#8a78a1]'}>
                      {sizesSummary}
                    </span>
                    <ChevronDown size={18} className={`transition-transform ${sizesOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {sizesOpen && (
                    <div className="absolute left-0 right-0 top-[calc(100%+10px)] z-20 rounded-[24px] border border-[#e2d5ef] bg-white p-3 shadow-[0_24px_50px_rgba(43,23,61,0.14)]">
                      <div className="grid gap-2 sm:grid-cols-2">
                        {resolvedSizeOptions.map((size) => {
                          const selected = form.sizes.includes(size);

                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => toggleSize(size)}
                              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                                selected
                                  ? 'border-[#7A1FA2] bg-[#f3e8fb] text-[#5a0e7a]'
                                  : 'border-[#eadff3] bg-[#fbf8fe] text-[#5f4a76] hover:border-[#caa8de]'
                              }`}
                            >
                              <span>{size}</span>
                              {selected && <Check size={16} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-[#6f5a86]">Select one or more sizes. Leave everything unchecked if the product has no size variants.</p>
              </label>
            </section>

            <section className="rounded-[28px] border border-[#e2d5ef] bg-white px-5 py-5">
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-black">Images</h3>
                  <p className="text-sm text-[#6f5a86]">Upload one or more product images. The first image becomes the product cover.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d8cae5] px-4 py-2 text-sm font-semibold text-[#5a357a] transition-colors hover:border-[#7A1FA2] hover:text-[#7A1FA2]">
                  {uploadingImages ? <LoaderCircle size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                  {uploadingImages ? 'Uploading...' : 'Upload images'}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                  />
                </label>
              </div>

              {uploadError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {uploadError}
                </div>
              )}

              {form.images.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {form.images.map((image, index) => (
                    <div key={`${image.url}-${index}`} className="overflow-hidden rounded-[24px] border border-[#efe6f6] bg-[#fbf8fe]">
                      <div className="relative aspect-[4/5] bg-[#f1e8f8]">
                        <Image
                          src={image.url}
                          alt={`Product image ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 240px"
                        />
                        {index === 0 && (
                          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-[#5a357a]">
                            Cover
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-3 px-4 py-3">
                        <p className="min-w-0 flex-1 truncate text-sm text-[#6f5a86]">{image.url}</p>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-red-200 text-red-500 transition-colors hover:bg-red-50"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-[#d8cae5] bg-[#fbf8fe] px-5 py-12 text-center text-sm text-[#6f5a86]">
                  No images uploaded yet.
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-[#e2d5ef] bg-white px-5 py-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black">Colors</h3>
                  <p className="text-sm text-[#6f5a86]">Hex values are required for visible swatches on the storefront.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, colors: [...current.colors, EMPTY_COLOR] }))}
                  className="inline-flex items-center gap-2 rounded-full border border-[#d8cae5] px-4 py-2 text-sm font-semibold text-[#5a357a] transition-colors hover:border-[#7A1FA2] hover:text-[#7A1FA2]"
                >
                  <Plus size={16} /> Add color
                </button>
              </div>

              <div className="space-y-3">
                {form.colors.map((color, index) => (
                  <div key={`color-${index}`} className="grid gap-3 rounded-2xl border border-[#efe6f6] bg-[#fbf8fe] p-4 md:grid-cols-[1fr_180px_auto]">
                    <input
                      value={color.name}
                      onChange={(event) => updateColor(index, 'name', event.target.value)}
                      className="rounded-2xl border border-[#d7c7e7] bg-white px-4 py-3 outline-none transition-colors focus:border-[#7A1FA2]"
                      placeholder="Onyx Black"
                    />
                    <div className="flex items-center gap-3 rounded-2xl border border-[#d7c7e7] bg-white px-4 py-2">
                      <input
                        type="color"
                        value={validateHexColor(color.hex) ? color.hex : '#000000'}
                        onChange={(event) => updateColor(index, 'hex', event.target.value)}
                        className="h-8 w-10 rounded-md border-0 bg-transparent p-0"
                      />
                      <input
                        value={color.hex}
                        onChange={(event) => updateColor(index, 'hex', event.target.value)}
                        className="w-full border-0 bg-transparent outline-none"
                        placeholder="#111111"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={form.colors.length === 1}
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          colors: current.colors.filter((_, colorIndex) => colorIndex !== index),
                        }))
                      }
                      className="inline-flex h-12 w-12 items-center justify-center self-center rounded-full border border-red-200 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label={`Remove color ${index + 1}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-5 rounded-[28px] border border-[#e2d5ef] bg-white px-5 py-5 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold">3D Model URL</span>
                <input
                  value={form.model3DUrl}
                  onChange={(event) => setForm((current) => ({ ...current, model3DUrl: event.target.value }))}
                  className="w-full rounded-2xl border border-[#d7c7e7] bg-white px-4 py-3 outline-none transition-colors focus:border-[#7A1FA2]"
                  placeholder="https://cdn.example.com/models/shirt.glb"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold">3D Model Public ID</span>
                <input
                  value={form.model3DPublicId}
                  onChange={(event) => setForm((current) => ({ ...current, model3DPublicId: event.target.value }))}
                  className="w-full rounded-2xl border border-[#d7c7e7] bg-white px-4 py-3 outline-none transition-colors focus:border-[#7A1FA2]"
                  placeholder="Optional public ID"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-[#e7daf1] bg-[#faf6fd] px-4 py-4">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))}
                  className="h-5 w-5 rounded border-[#c8afd9] text-[#7A1FA2] focus:ring-[#7A1FA2]"
                />
                <span>
                  <span className="block font-semibold">Featured product</span>
                  <span className="text-sm text-[#6f5a86]">Show this item in the featured storefront collection.</span>
                </span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-[#e7daf1] bg-[#faf6fd] px-4 py-4">
                <input
                  type="checkbox"
                  checked={form.isNewArrival}
                  onChange={(event) => setForm((current) => ({ ...current, isNewArrival: event.target.checked }))}
                  className="h-5 w-5 rounded border-[#c8afd9] text-[#7A1FA2] focus:ring-[#7A1FA2]"
                />
                <span>
                  <span className="block font-semibold">New arrival</span>
                  <span className="text-sm text-[#6f5a86]">Surface this item in the new-arrivals flow.</span>
                </span>
              </label>
            </section>

            <section className="rounded-[28px] border border-[#e2d5ef] bg-white px-5 py-5">
              <div className="mb-4">
                <h3 className="text-lg font-black">Discount / Offer</h3>
                <p className="text-sm text-[#6f5a86]">Leave blank to show no discount. Set both fields to activate a timed offer.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Discount % (0–100)</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={form.discount}
                    onChange={(e) => setForm((c) => ({ ...c, discount: e.target.value }))}
                    className="w-full rounded-2xl border border-[#d7c7e7] bg-white px-4 py-3 outline-none transition-colors focus:border-[#7A1FA2]"
                    placeholder="e.g. 20"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Offer ends at</span>
                  <input
                    type="datetime-local"
                    value={form.discountEndsAt}
                    onChange={(e) => setForm((c) => ({ ...c, discountEndsAt: e.target.value }))}
                    className="w-full rounded-2xl border border-[#d7c7e7] bg-white px-4 py-3 outline-none transition-colors focus:border-[#7A1FA2]"
                  />
                </label>
              </div>
              {(form.discount || form.discountEndsAt) && (
                <button
                  type="button"
                  onClick={() => setForm((c) => ({ ...c, discount: '', discountEndsAt: '' }))}
                  className="mt-3 text-xs text-red-500 hover:underline"
                >
                  Clear discount
                </button>
              )}
            </section>

            <div className="flex flex-col gap-3 border-t border-[#e2d5ef] pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-full border border-[#d8cae5] px-6 py-3 font-semibold text-[#5a357a] transition-colors hover:border-[#7A1FA2] hover:text-[#7A1FA2]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImages}
                className="inline-flex items-center justify-center rounded-full bg-[#7A1FA2] px-6 py-3 font-bold text-white transition-colors hover:bg-[#5A0E7A] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

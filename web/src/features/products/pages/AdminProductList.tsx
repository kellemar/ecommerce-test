import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge, Button, Label, Modal, Select, Table, Textarea, TextInput } from 'flowbite-react';
import { ChangeEvent, useRef, useState } from 'react';
import api from '../../../lib/api-client';

interface ProductImage {
  id: number;
  imageUrl: string;
  sortOrder: number;
}

interface ProductSummary {
  id: number;
  name: string;
  slug: string;
  priceCents: number;
  stockQty: number;
  status: string;
  description?: string;
  images?: ProductImage[];
}

type ProductDetail = ProductSummary & { images: ProductImage[] };

interface ProductListResponse {
  items: ProductSummary[];
  count: number;
}

type ProductFormMode = 'create' | 'edit';

interface ProductFormState {
  name: string;
  slug: string;
  description: string;
  priceCents: string;
  stockQty: string;
  status: string;
}

type ProductSubmitPayload = {
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  stockQty: number;
  status: string;
};

const INITIAL_FORM_STATE: ProductFormState = {
  name: '',
  slug: '',
  description: '',
  priceCents: '',
  stockQty: '',
  status: 'draft',
};

const resolveImageUrl = (imageUrl: string) => {
  if (!imageUrl) {
    return '';
  }
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }
  return `/store/images/${imageUrl}`;
};

export function AdminProductList() {
  const [editingProduct, setEditingProduct] = useState<ProductDetail | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState<ProductFormMode>('edit');
  const [formData, setFormData] = useState<ProductFormState>(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const uploadImageInputRef = useRef<HTMLInputElement | null>(null);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ProductListResponse>({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const response = await api.get<ProductListResponse>('/products');
      return response.data;
    },
  });

  const resetImageState = () => {
    setNewImageFile(null);
    setNewImagePreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return null;
    });
  };

  const resetFormState = () => {
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
    setSlugTouched(false);
    resetImageState();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormMode('edit');
    resetFormState();
  };

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ProductSubmitPayload }) => {
      const response = await api.patch(`/products/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeModal();
    },
    onError: (error: Error) => {
      setFormError(error.message ?? 'Failed to update product');
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async ({ data, imageFile }: { data: ProductSubmitPayload; imageFile: File }) => {
      const response = await api.post<ProductDetail>('/products', data);
      const product = response.data;
      const imageFormData = new FormData();
      imageFormData.append('file', imageFile);
      const imageResponse = await api.post<ProductImage>(
        `/products/${product.id}/images`,
        imageFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        },
      );
      return { ...product, images: [imageResponse.data] };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      closeModal();
    },
    onError: (error: Error) => {
      setFormError(error.message ?? 'Failed to create product');
    },
  });

  const replaceImageMutation = useMutation<ProductImage, Error, { productId: number; imageId: number; file: File }>({
    mutationFn: async ({ productId, imageId, file }) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.put<ProductImage>(`/products/${productId}/images/${imageId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (updatedImage) => {
      setEditingProduct(prev => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          images: [updatedImage],
        };
      });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: Error) => {
      setFormError(error.message ?? 'Failed to replace image');
    },
  });

  const addImageMutation = useMutation<ProductImage, Error, { productId: number; file: File }>({
    mutationFn: async ({ productId, file }) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post<ProductImage>(`/products/${productId}/images`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (createdImage) => {
      setEditingProduct(prev => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          images: [createdImage],
        };
      });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
    onError: (error: Error) => {
      setFormError(error.message ?? 'Failed to upload image');
    },
  });

  const handleRowClick = async (product: ProductSummary) => {
    // Fetch full product details for editing
    try {
      const response = await api.get<ProductDetail>(`/products/${product.id}`);
      const fullProduct = response.data;

      resetFormState();
      setFormMode('edit');
      setEditingProduct({ ...fullProduct, images: fullProduct.images ?? [] });
      setFormData({
        name: fullProduct.name,
        slug: fullProduct.slug,
        description: fullProduct.description ?? '',
        priceCents: (fullProduct.priceCents / 100).toFixed(2),
        stockQty: String(fullProduct.stockQty),
        status: fullProduct.status,
      });
      setSlugTouched(true);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to fetch product details:', error);
    }
  };

  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleInputChange = (field: keyof ProductFormState, value: string) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (formMode === 'create' && field === 'name' && !slugTouched) {
        next.slug = slugify(value);
      }
      if (field === 'slug') {
        setSlugTouched(true);
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formData.name.trim();
    const trimmedSlug = formData.slug.trim();
    const trimmedDescription = formData.description.trim();

    if (
      !trimmedName ||
      !trimmedSlug ||
      !trimmedDescription ||
      !formData.priceCents ||
      !formData.stockQty ||
      !formData.status
    ) {
      setFormError('Please fill in all fields.');
      return;
    }

    const priceFloat = Number.parseFloat(formData.priceCents);
    const stockInt = Number.parseInt(formData.stockQty, 10);

    if (Number.isNaN(priceFloat) || priceFloat < 0) {
      setFormError('Price must be a non-negative number.');
      return;
    }

    if (Number.isNaN(stockInt) || stockInt < 0) {
      setFormError('Stock quantity must be a non-negative integer.');
      return;
    }

    const payload: ProductSubmitPayload = {
      name: trimmedName,
      slug: trimmedSlug,
      description: trimmedDescription,
      priceCents: Math.round(priceFloat * 100),
      stockQty: stockInt,
      status: formData.status,
    };

    if (formMode === 'create') {
      if (!newImageFile) {
        setFormError('Product image is required.');
        return;
      }

      createProductMutation.mutate({ data: payload, imageFile: newImageFile });
      return;
    }

    if (!editingProduct) {
      setFormError('Unable to update: product not loaded.');
      return;
    }

    updateProductMutation.mutate({
      id: editingProduct.id,
      data: payload,
    });
  };

  const handleReplaceImageClick = () => {
    if (formMode !== 'edit') {
      handleUploadImageClick();
      return;
    }

    if (replaceInputRef.current) {
      replaceInputRef.current.value = '';
      replaceInputRef.current.click();
    }
  };

  const handleReplaceImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (formMode !== 'edit') {
      event.target.value = '';
      return;
    }

    const file = event.target.files?.[0];
    if (!file || !editingProduct) {
      return;
    }

    const primaryImage = editingProduct.images[0];
    event.target.value = '';

    if (!primaryImage) {
      addImageMutation.mutate({ productId: editingProduct.id, file });
      return;
    }

    replaceImageMutation.mutate({ productId: editingProduct.id, imageId: primaryImage.id, file });
  };

  const handleUploadImageClick = () => {
    if (uploadImageInputRef.current) {
      uploadImageInputRef.current.value = '';
      uploadImageInputRef.current.click();
    }
  };

  const handleUploadImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    event.target.value = '';

    if (formMode === 'create') {
      setNewImageFile(file);
      setNewImagePreview(prev => {
        if (prev) {
          URL.revokeObjectURL(prev);
        }
        return URL.createObjectURL(file);
      });
      return;
    }

    if (!editingProduct) {
      return;
    }

    addImageMutation.mutate({ productId: editingProduct.id, file });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'success';
      case 'draft':
        return 'warning';
      case 'archived':
        return 'gray';
      default:
        return 'info';
    }
  };

  const handleAddProduct = () => {
    resetFormState();
    setEditingProduct(null);
    setFormMode('create');
    setShowModal(true);
  };

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
        <Button onClick={handleAddProduct}>Add product</Button>
      </div>
      <div className="overflow-x-auto">
        <Table striped hoverable>
        <Table.Head>
          <Table.HeadCell>Name</Table.HeadCell>
          <Table.HeadCell>Stock</Table.HeadCell>
          <Table.HeadCell>Status</Table.HeadCell>
          <Table.HeadCell>Price</Table.HeadCell>
        </Table.Head>
        <Table.Body className="divide-y">
          {isLoading ? (
            <Table.Row>
              <Table.Cell colSpan={4}>Loading...</Table.Cell>
            </Table.Row>
          ) : data?.items?.length ? (
          data.items.map((item) => (
          <Table.Row
          key={item.id}
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => handleRowClick(item)}
          >
            <Table.Cell className="font-medium text-slate-900">{item.name}</Table.Cell>
              <Table.Cell>{item.stockQty}</Table.Cell>
                <Table.Cell>
                  <Badge color={getStatusColor(item.status)} className="capitalize">
                    {item.status}
                  </Badge>
                </Table.Cell>
                <Table.Cell>${(item.priceCents / 100).toFixed(2)}</Table.Cell>
              </Table.Row>
            ))
          ) : (
            <Table.Row>
              <Table.Cell colSpan={4}>No products yet.</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
        </Table>
      </div>

      <Modal show={showModal} onClose={closeModal} size="2xl">
        <Modal.Header>
          {formMode === 'create' ? 'Add Product' : 'Edit Product'}
        </Modal.Header>
        <form onSubmit={handleSubmit}>
          <Modal.Body>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {formError ? (
                <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </p>
              ) : null}

              <div>
                <Label htmlFor="name" value="Product Name" />
                <TextInput
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug" value="Slug" />
                <TextInput
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleInputChange('slug', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" value="Description" />
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price" value="Price ($)" />
                  <TextInput
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.priceCents}
                    onChange={(e) => handleInputChange('priceCents', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="stock" value="Stock Quantity" />
                  <TextInput
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stockQty}
                    onChange={(e) => handleInputChange('stockQty', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status" value="Status" />
                <Select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </Select>
              </div>

              {formMode === 'edit' && editingProduct ? (
                <div>
                  <Label value="Product image" />
                  {editingProduct.images.length ? (
                    <div className="mt-3 space-y-3 rounded border border-slate-200 p-3">
                      <div className="flex max-h-48 w-full items-center justify-center overflow-hidden rounded bg-slate-100">
                        <img
                          src={resolveImageUrl(editingProduct.images[0].imageUrl)}
                          alt={editingProduct.name}
                          className="max-h-48 max-w-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Image</span>
                        <Button
                          size="xs"
                          type="button"
                          onClick={handleReplaceImageClick}
                          disabled={replaceImageMutation.isPending}
                        >
                          {replaceImageMutation.isPending ? 'Replacing…' : 'Replace image'}
                        </Button>
                      </div>
                      <input
                        ref={replaceInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleReplaceImageChange}
                      />
                    </div>
                  ) : (
                    <div className="mt-3">
                      <p className="text-sm text-slate-500">No image uploaded yet.</p>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-3"
                        onClick={handleUploadImageClick}
                        disabled={addImageMutation.isPending}
                      >
                        {addImageMutation.isPending ? 'Uploading…' : 'Upload image'}
                      </Button>
                      <input
                        ref={uploadImageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadImageChange}
                      />
                    </div>
                  )}
                </div>
              ) : null}

              {formMode === 'create' ? (
                <div>
                  <Label value="Product image" />
                  <div className="mt-3 space-y-3 rounded border border-slate-200 p-3">
                    <div className="flex max-h-48 w-full items-center justify-center overflow-hidden rounded bg-slate-100">
                      {newImagePreview ? (
                        <img
                          src={newImagePreview}
                          alt="Selected product"
                          className="max-h-48 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-sm text-slate-500">Select an image to upload.</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">
                        {newImagePreview ? 'Image selected' : 'Image required'}
                      </span>
                      <Button
                        type="button"
                        size="xs"
                        onClick={handleUploadImageClick}
                        disabled={createProductMutation.isPending}
                      >
                        {newImagePreview ? 'Change image' : 'Select image'}
                      </Button>
                    </div>
                    <input
                      ref={uploadImageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadImageChange}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              type="button"
              color="gray"
              onClick={closeModal}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={formMode === 'create' ? createProductMutation.isPending : updateProductMutation.isPending}
            >
              {formMode === 'create'
                ? createProductMutation.isPending
                  ? 'Creating…'
                  : 'Create Product'
                : updateProductMutation.isPending
                  ? 'Saving…'
                  : 'Save Changes'}
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </section>
  );
}

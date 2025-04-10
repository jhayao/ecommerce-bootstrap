import { API_URL } from './custom.js';
import { addEventToProductItem } from './main.js'
import $ from "jquery";

// Sidebar
$(document).ready(function() {
    const filterSidebarBtn = $('.filter-sidebar-btn');
    const sidebar = $('.sidebar');
    const sidebarMain = $('.sidebar .sidebar-main');
    const closeSidebarBtn = $('.sidebar .sidebar-main .close-sidebar-btn');

    if (filterSidebarBtn.length && sidebar.length) {
        filterSidebarBtn.on('click', function() {
            sidebar.toggleClass('open');
        });

        if (sidebarMain.length) {
            sidebar.on('click', function() {
                sidebar.removeClass('open')
            });

            sidebarMain.on('click', function(e) {
                e.stopPropagation();
            });

            closeSidebarBtn.on('click', function() {
                sidebar.removeClass('open');
            });
        }
    }

    // List product
    const productContainer = $('.shop-product .list-product-block');
    const productList = $('.list-product-block .list-product');
    const listPagination = $('.list-pagination');

    let currentPage = 1;
    let productsPerPage = productList.length ? Number(productList.data('item')) : 12;
    let productsData = [];

    // Filer product by type(in breadcrumb and sidebar)
    let selectedType = localStorage.getItem('selectedType');
    localStorage.setItem('selectedType', '');

    // Tow bar filter product by price
    const rangeInput = $('.range-input input');
    const progress = $('.tow-bar-block .progress');
    const minPrice = $('.min-price');
    const maxPrice = $('.max-price');

    let priceGap = 10;

    rangeInput.on('input', function(e) {
        let minValue = parseInt(rangeInput.eq(0).val());
        let maxValue = parseInt(rangeInput.eq(1).val());

        if (maxValue - minValue < priceGap) {
            if ($(this).hasClass('range-min')) {
                rangeInput.eq(0).val(maxValue - priceGap);
            } else {
                rangeInput.eq(1).val(minValue + priceGap);
            }
        } else {
            progress.css('left', (minValue / rangeInput.eq(0).attr('max')) * 100 + "%");
            progress.css('right', 100 - (maxValue / rangeInput.eq(1).attr('max')) * 100 + "%");
        }

        minPrice.text('$' + minValue);
        maxPrice.text('$' + maxValue);

        if (minValue >= 290) {
            minPrice.text('$' + 290);
        }

        if (maxValue <= 10) {
            maxPrice.text('$' + 10);
        }
    });

    // Function to fetch products from JSON file
    function fetchProducts() {
        console.log('fetchProducts');
        $.ajax({
            url: `${API_URL}/products/list`,
            type: 'GET',
            contentType: 'application/json',
            headers: {
                'Accept': 'application/json'
            },
            success: function(data) {
                productsData = data;
                renderProducts(currentPage, productsData);
                renderPagination(productsData);
                addEventToProductItem(productsData);
                // Switch between grid <-> list layout
                const layoutItems = productContainer.find('.choose-layout .item');
                layoutItems.on('click', function(e) {
                    e.stopPropagation();
                    if ($(this).hasClass('style-grid')) {
                        productContainer.removeClass('style-list').addClass('style-grid');
                        productContainer.find('.list-product').removeClass('flex flex-col').addClass('grid').attr('data-item', '9');
                        productsPerPage = 9;
                    } else if ($(this).hasClass('style-list')) {
                        productContainer.removeClass('style-grid').addClass('style-list');
                        productContainer.find('.list-product').removeClass('grid').addClass('flex flex-col').attr('data-item', '4');
                        productsPerPage = 4;
                    }
                    renderProducts(1, productsData);
                    currentPage = 1;
                    renderPagination(productsData);
                    console.log('add event');
                    addEventToProductItem(productsData);
                });

                let selectedFilters = {};

                // handle event when user change filter
                function handleFiltersChange() {
                    selectedFilters = {
                        type: $('.filter-type .active').data('item'),
                        size: $.map($('.filter-size .size-item.active'), function(item) {
                            return $(item).data('item');
                        }),
                        color: $.map($('.filter-color .color-item.active'), function(item) {
                            return $(item).data('item');
                        }),
                        brand: $.map($('.filter-brand .brand-item input[type="checkbox"]:checked'), function(item) {
                            return $(item).attr('name');
                        }),
                        minPrice: 0,
                        maxPrice: 300,
                        sale: $('.check-sale input[type="checkbox"]:checked').length > 0
                    };

                    // Filter options
                    if ($('.filter-type select').length) {
                        const typeValue = $('.filter-type select').val();
                        selectedFilters.type = typeValue !== "null" ? typeValue : [];
                    }

                    if ($('.filter-size select').length) {
                        const sizeValue = $('.filter-size select').val();
                        selectedFilters.size = sizeValue !== "null" ? sizeValue : [];
                    }

                    if ($('.filter-color select').length) {
                        const colorValue = $('.filter-color select').val();
                        selectedFilters.color = colorValue !== "null" ? colorValue : [];
                    }

                    if ($('.filter-brand select').length) {
                        const brandValue = $('.filter-brand select').val();
                        selectedFilters.brand = brandValue !== "null" ? brandValue : [];
                    }

                    if (rangeInput.length > 1) {
                        selectedFilters.minPrice = parseInt(rangeInput.eq(0).val());
                        selectedFilters.maxPrice = parseInt(rangeInput.eq(1).val());

                        if ($('.filter-price select').length) {
                            const selectPrice = $('.filter-price select').val();
                            if (selectPrice !== "null") {
                                const [min, max] = selectPrice.split('-').map(val => parseInt(val.replace('$', '').trim()));
                                selectedFilters.minPrice = parseInt(min);
                                selectedFilters.maxPrice = parseInt(max);
                            } else {
                                selectedFilters.minPrice = 0;
                                selectedFilters.maxPrice = 300;
                            }
                        }
                    }

                    // filter product base on items filtered
                    let filteredProducts = productsData.filter(function(product) {
                        if (selectedFilters.type && selectedFilters.type.length > 0 && product.type !== selectedFilters.type) return false;
                        if (selectedFilters.size && selectedFilters.size.length > 0 && !product.sizes.some(size => selectedFilters.size.includes(size))) return false;
                        if (selectedFilters.color && selectedFilters.color.length > 0 && !product.variation.some(variant => selectedFilters.color.includes(variant.color))) return false;
                        if (selectedFilters.brand && selectedFilters.brand.length > 0 && !selectedFilters.brand.includes(product.brand)) return false;
                        if (selectedFilters.minPrice && product.price < selectedFilters.minPrice) return false;
                        if (selectedFilters.maxPrice && product.price > selectedFilters.maxPrice) return false;
                        if (selectedFilters.sale && product.sale !== true) return false;
                        return true;
                    });

                    // Set list filtered
                    const listFiltered = $('.list-filtered');

                    let newHtmlListFiltered = `
                        <div class="total-product">
                            ${filteredProducts.length}
                            <span class='text-secondary pl-1'>Products Found</span>
                        </div>
                        <div class="list flex items-center gap-3">
                            <div class='w-px h-4 bg-line'></div>
                            ${selectedFilters.type ? (
                            `
                                    <div class="item flex items-center px-2 py-1 gap-1 bg-linear rounded-full capitalize" data-type="type">
                                        <i class='ph ph-x cursor-pointer'></i>
                                        <span>${selectedFilters.type}</span>
                                    </div>
                                `
                        ) : ''}
                            ${selectedFilters.size.length ? (
                            `<div class="item flex items-center px-2 py-1 gap-1 bg-linear rounded-full capitalize" data-type="size">
                                    <i class='ph ph-x cursor-pointer'></i>
                                    <span>${selectedFilters.size.join(', ')}</span>
                                </div>`
                        ) : ''}
                            ${selectedFilters.color.length ? (
                            `<div class="item flex items-center px-2 py-1 gap-1 bg-linear rounded-full capitalize" data-type="color">
                                    <i class='ph ph-x cursor-pointer'></i>
                                    <span>${selectedFilters.color.join(', ')}</span>
                                </div>`
                        ) : ''}
                            ${typeof selectedFilters.brand === 'object' && selectedFilters.brand.length ? (
                            `
                                ${selectedFilters.brand.map(function(item) {
                                return `
                                        <div class="item flex items-center px-2 py-1 gap-1 bg-linear rounded-full capitalize" data-type="brand" data-item=${item}>
                                            <i class='ph ph-x cursor-pointer'></i>
                                            <span>${item}</span>
                                        </div>
                                    `;
                            }).join('')}
                            `
                        ) : ''}
                            ${typeof selectedFilters.brand !== 'object' && selectedFilters.brand.length ? (
                            `
                                    <div class="item flex items-center px-2 py-1 gap-1 bg-linear rounded-full capitalize" data-type="brand" data-item=${selectedFilters.brand}>
                                        <i class='ph ph-x cursor-pointer'></i>
                                        <span>${selectedFilters.brand}</span>
                                    </div>
                                `
                        ) : ''}
                        </div>
                        <div
                            class="clear-btn flex items-center px-2 py-1 gap-1 rounded-full w-fit border border-red cursor-pointer">
                            <i class='ph ph-x cursor-pointer text-red'></i>
                            <span class='text-button-uppercase text-red'>Clear All</span>
                        </div>
                    `;

                    // remove content in listFiltered
                    listFiltered.html('');

                    // add newHtmlListFiltered to listFiltered
                    listFiltered.append(newHtmlListFiltered);

                    // Remove filtered
                    // Remove item from list filtered
                    const clearBtnItem = $('.list-filtered .list .item');

                    clearBtnItem.on('click', function() {
                        let dataType = $(this).data('type');
                        $(`.filter-${dataType} .active`).removeClass('active');
                        if ($(`.filter-${dataType} select`).length) $(`.filter-${dataType} select`).val(null);

                        if (dataType === 'brand') {
                            let dataItem = $(this).data('item');
                            $('.filter-brand .brand-item input[type="checkbox"]:checked').each(function() {
                                if ($(this).attr('id') === dataItem) {
                                    $(this).prop('checked', false);
                                }
                            });
                        }

                        handleFiltersChange();
                        if (!selectedFilters.type && selectedFilters.size.length === 0 && selectedFilters.color.length === 0 && selectedFilters.brand.length === 0) {
                            listFiltered.html('');
                        }
                    });

                    // Remove all
                    const clearBtn = $('.list-filtered .clear-btn');

                    clearBtn.on('click', function() {
                        $('.filter-type .active').removeClass('active');
                        $('.filter-size .active').removeClass('active');
                        $('.filter-color .active').removeClass('active');
                        $('.filter-brand .brand-item input[type="checkbox"]:checked').prop('checked', false);
                        if ($('.check-sale input[type="checkbox"]:checked').length) {
                            $('.check-sale input[type="checkbox"]:checked').prop('checked', false);
                        }

                        handleFiltersChange();
                        listFiltered.html('');
                    });

                    // Handle sort product
                    if (sortOption === 'soldQuantityHighToLow') {
                        filteredProducts = filteredProducts.sort(function(a, b) {
                            return b.sold - a.sold;
                        });
                    }

                    if (sortOption === 'discountHighToLow') {
                        filteredProducts = filteredProducts.sort(function(a, b) {
                            return (Math.floor(100 - ((b.price / b.originPrice) * 100))) - (Math.floor(100 - ((a.price / a.originPrice) * 100)));
                        });
                    }

                    if (sortOption === 'priceHighToLow') {
                        filteredProducts = filteredProducts.sort(function(a, b) {
                            return b.price - a.price;
                        });
                    }

                    if (sortOption === 'priceLowToHigh') {
                        filteredProducts = filteredProducts.sort(function(a, b) {
                            return a.price - b.price;
                        });
                    }

                    // Rerender product base on items filtered
                    renderProducts(1, filteredProducts);
                    currentPage = 1;
                    renderPagination(filteredProducts);
                    addEventToProductItem(productsData);
                }

                // filter product
                const typeItems = $('.filter-type .item');
                const sizeItems = $('.filter-size .size-item');
                const colorItems = $('.filter-color .color-item');
                const brandItems = $('.filter-brand .brand-item');
                const checkboxBrandItems = $('.filter-brand .brand-item input[type="checkbox"]');
                const checkSale = $('.check-sale input');

                // sort product
                const sortSelect = $('.sort-product select');
                let sortOption = sortSelect.val();

                // Get filter type from url
                const pathname = new URL(window.location.href);
                const typeUrl = pathname.searchParams.get('type') === null ? '' : pathname.searchParams.get('type');

                if (typeUrl !== '') {
                    localStorage.setItem('selectedType', typeUrl);
                    typeItems.each(function() {
                        if ($(this).data('item') === localStorage.getItem('selectedType')) {
                            $(this).addClass('active');
                        } else {
                            $(this).removeClass('active');
                        }

                        handleFiltersChange();
                    });
                }

                // handle events when user change filter
                typeItems.on('click', function() {
                    localStorage.setItem('selectedType', $(this).data('item'));

                    typeItems.each(function() {
                        if ($(this).data('item') === localStorage.getItem('selectedType')) {
                            $(this).addClass('active');
                        } else {
                            $(this).removeClass('active');
                        }
                    });
                    handleFiltersChange();
                });

                // shop-filter-options.html
                if ($('.filter-type select').length) {
                    $('.filter-type select').on('change', handleFiltersChange);
                }

                sizeItems.on('click', function() {
                    let parent = $(this).parent();
                    if (!parent.find(".active").length) {
                        $(this).addClass("active");
                    } else {
                        parent.find(".active").removeClass("active");
                        $(this).addClass("active");
                    }
                    handleFiltersChange();
                });

                // shop-filter-options.html
                if ($('.filter-size select').length) {
                    $('.filter-size select').on('change', handleFiltersChange);
                }

                colorItems.on('click', function() {
                    let parent = $(this).parent();
                    if (!parent.find(".active").length) {
                        $(this).addClass("active");
                    } else {
                        parent.find(".active").removeClass("active");
                        $(this).addClass("active");
                    }
                    handleFiltersChange();
                });

                // shop-filter-options.html
                if ($('.filter-color select').length) {
                    $('.filter-color select').on('change', handleFiltersChange);
                }

                brandItems.each(function() {
                    if ($(this).find('.number').length) {
                        $(this).find('.number').text(productsData.filter(function(product) {
                            return product.brand === $(this).data('item');
                        }).length);
                    }
                });

                checkboxBrandItems.on('change', handleFiltersChange);

                // shop-filter-options.html
                if ($('.filter-brand select').length) {
                    $('.filter-brand select').on('change', handleFiltersChange);
                }

                rangeInput.on('input', handleFiltersChange);

                // shop-filter-options.html
                if ($('.filter-price select').length) {
                    $('.filter-price select').on('change', handleFiltersChange);
                }

                if (checkSale.length) {
                    checkSale.on('change', handleFiltersChange);
                }

                sortSelect.on('change', function() {
                    sortOption = sortSelect.val();
                    handleFiltersChange();
                });
            },
            error: function(xhr, status, error) {
                console.error('Error fetching products:', error);
            }
        });
    }

    // Function to render products for a specific page
    function renderProducts(page, products = []) {
        productList.html('');
        const productsToDisplay = products;

        const startIndex = (page - 1) * productsPerPage;
        const endIndex = startIndex + productsPerPage;
        const displayedProducts = productsToDisplay.slice(startIndex, endIndex);

        if (displayedProducts.length === 0) {
            productList.html(`
                <div class="list-empty">
                    <p class="text-gray-500 text-base">No product found</p>
                </div>
            `);
            return;
        }

        displayedProducts.forEach(function(product) {
            const productItem = $('<div>').attr('data-item', product.id);

            let productTags = '';
            if (product.new) {
                productTags += `<div class="product-tag text-button-uppercase bg-green px-3 py-0.5 inline-block rounded-full absolute top-3 left-3 z-[1]">New</div>`;
            }
            if (product.sale) {
                productTags += `<div class="product-tag text-button-uppercase text-white bg-red px-3 py-0.5 inline-block rounded-full absolute top-3 left-3 z-[1]">Sale</div>`;
            }

            let productImages = '';
            product.images.slice(0, 2).forEach(function(img, index) {
                productImages += `<img key="${index}" class="w-full h-full object-cover duration-700" src="${img.image}" alt="img">`;
            });
            if (productContainer.hasClass('style-grid')) {
                productItem.addClass('product-item grid-type');
                productItem.html(`
                    <div class="product-main cursor-pointer block" data-item="${product.id}">
                        <div class="product-thumb bg-white relative overflow-hidden rounded-2xl">
                            ${productTags}
                            <div class="list-action-right absolute top-3 right-3 max-lg:hidden">
                                <div class="add-wishlist-btn w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 relative">
                                    <div class="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">Add To Wishlist</div>
                                    <i class="ph ph-heart text-lg"></i>
                                </div>
                                <div class="compare-btn w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 relative mt-2">
                                    <div class="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">Compare Product</div>
                                    <i class="ph ph-arrow-counter-clockwise text-lg compare-icon"></i>
                                    <i class="ph ph-check-circle text-lg checked-icon"></i>
                                </div>
                            </div>
                            <div class="product-img w-full h-full aspect-[3/4]">
                                ${productImages}
                            </div>
                            <div class="list-action grid grid-cols-2 gap-3 px-5 absolute w-full bottom-5 max-lg:hidden">
                                <div class="quick-view-btn w-full text-button-uppercase py-2 text-center rounded-full duration-300 bg-white hover:bg-black hover:text-white">
                                    <span class="max-lg:hidden">Quick View</span>
                                    <i class="ph ph-eye lg:hidden text-xl"></i>
                                </div>
                                    ${product.action === 'add to cart' ? (
                    `
                                        <div
                                            class="add-cart-btn w-full text-button-uppercase py-2 text-center rounded-full duration-300 bg-white hover:bg-black hover:text-white"
                                            >
                                            <span class="max-lg:hidden">Add To Cart</span>
                                            <i class="ph ph-shopping-bag-open lg:hidden text-xl"></i>
                                        </div>
                                    `
                ) : (
                    `
                                        <div
                                            class="quick-shop-btn text-button-uppercase py-2 text-center rounded-full duration-500 bg-white hover:bg-black hover:text-white max-lg:hidden">
                                            Quick Shop</div>
                                        <div
                                            class="add-cart-btn w-full text-button-uppercase py-2 text-center rounded-full duration-300 bg-white hover:bg-black hover:text-white lg:hidden"
                                            >
                                            <span class="max-lg:hidden">Add To Cart</span>
                                            <i class="ph ph-shopping-bag-open lg:hidden text-xl"></i>
                                        </div>
                                        <div class="quick-shop-block absolute left-5 right-5 bg-white p-5 rounded-[20px]">
                                            <div class="list-size flex items-center justify-center flex-wrap gap-2">
                                                ${product.sizes && product.sizes.map((size, index) => (
                        `<div key="${index}" class="size-item w-10 h-10 rounded-full flex items-center justify-center text-button bg-white border border-line">${size.trim()}</div>`
                    )).join('')}
                                            </div >
                        <div class="add-cart-btn button-main w-full text-center rounded-full py-3 mt-4">Add
                            To cart</div>
                                                </div >
                        `
                )}
                                    </div>
                                </div>
                                <div class="product-infor mt-4 lg:mb-7">
                                    <div class="product-sold sm:pb-4 pb-2">
                                        <div class="progress bg-line h-1.5 w-full rounded-full overflow-hidden relative">
                                            <div class='progress-sold bg-red absolute left-0 top-0 h-full' style="width: ${Math.floor((product.sold / product.quantity) * 100)}%">
                                            </div>
                                        </div>
                                        <div class="flex items-center justify-between gap-3 gap-y-1 flex-wrap mt-2">
                                            <div class="text-button-uppercase">
                                                <span class='text-secondary2 max-sm:text-xs'>Sold:
                                                </span>
                                                <span class='max-sm:text-xs'>${product.sold}</span>
                                            </div>
                                            <div class="text-button-uppercase">
                                                <span class='text-secondary2 max-sm:text-xs'>Available:
                                                </span>
                                                <span class='max-sm:text-xs'>${product.quantity - product.sold}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="product-name text-title duration-300">${product.name}</div>
                                    
                            <div
                            class="product-price-block flex items-center gap-2 flex-wrap mt-1 duration-300 relative z-[1]">
                            <div class="product-price text-title">$${product.price}.00</div>
                            ${Math.floor(100 - ((product.price / product.originPrice) * 100)) > 0 ? (
                    `
                                    <div class="product-origin-price caption1 text-secondary2">
                                        <del>$${product.originPrice}.00</del>
                                    </div>
                                    <div
                                        class="product-sale caption1 font-medium bg-green px-3 py-0.5 inline-block rounded-full">
                                        -${Math.floor(100 - ((product.price / product.originPrice) * 100))}%
                                    </div>
                            `
                ) : ('')}
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            }
            if (productContainer.hasClass('style-list')) {
                productItem.addClass('product-item list-type');
                productItem.html(`
                    <div class="product-main cursor-pointer flex lg:items-center sm:justify-between gap-7 max-lg:gap-5">
                        <div class="product-thumb bg-white relative overflow-hidden rounded-2xl block max-sm:w-1/2">
                            ${productTags}
                            <div class="product-img w-full aspect-[3/4] rounded-2xl overflow-hidden">
                                ${productImages}
                            </div>
                            <div class="list-action px-5 absolute w-full bottom-5 max-lg:hidden">
                                <div class="quick-shop-block absolute left-5 right-5 bg-white p-5 rounded-[20px]">
                                        <div class="list-size flex items-center justify-center flex-wrap gap-2">
                                            ${product.sizes && product.sizes.map((size, index) => (
                `
                                                ${size === 'freesize' ? (
                    `
                                                    <div key="${index}" class="size-item px-3 py-1.5 rounded-full text-button bg-white border border-line">${size.trim()}</div>
                                                    `
                ) : (
                    `<div key="${index}" class="size-item w-10 h-10 rounded-full flex items-center justify-center text-button bg-white border border-line">${size.trim()}</div>`
                )}
                `
            )).join('')}
                                        </div>
                                        <div class="add-cart-btn button-main w-full text-center rounded-full py-3 mt-4">Add To cart</div>
                                </div>
                            </div>
                        </div>
                        <div class='flex sm:items-center gap-7 max-lg:gap-4 max-lg:flex-wrap lg:w-2/3 lg:flex-shrink-0 max-lg:w-full max-sm:flex-col max-sm:w-1/2'>
                                <div class="product-infor max-sm:w-full">
                                    <div class="product-name heading6 inline-block duration-300">${product.name}</div>
                                    <div class="product-price-block flex items-center gap-2 flex-wrap mt-2 duration-300 relative z-[1]">
                                        <div class="product-price text-title">$${product.price}.00</div>
                                        ${Math.floor(100 - ((product.price / product.originPrice) * 100)) > 0 ? (
                    `
                                                <div class="product-origin-price caption1 text-secondary2">
                                                    <del>$${product.originPrice}.00</del>
                                                </div>
                                                <div
                                                    class="product-sale caption1 font-medium bg-green px-3 py-0.5 inline-block rounded-full">
                                                    -${Math.floor(100 - ((product.price / product.originPrice) * 100))}%
                                                </div>
                                        `
                ) : ('')}
                                    </div>
                                    <div class='text-secondary desc mt-5 max-sm:hidden'>${product.description}</div>
                                </div>
                                <div class="action w-fit flex flex-col items-center justify-center">
                                    <div class="quick-shop-btn button-main whitespace-nowrap py-2 px-9 max-lg:px-5 rounded-full bg-white text-black border border-black hover:bg-black hover:text-white">
                                        Quick Shop
                                    </div>
                                    <div class="list-action-right flex items-center justify-center gap-3 mt-4">
                                        <div
                                            class="add-wishlist-btn w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 relative">
                                            <div class="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">
                                                Add To Wishlist</div>
                                                <i class="ph ph-heart text-lg"></i>
                                            </div>
                                        <div
                                            class="compare-btn w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 relative">
                                            <div class="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">
                                                Compare Product</div>
                                            <i class="ph ph-arrow-counter-clockwise text-lg compare-icon"></i>
                                            <i class="ph ph-check-circle text-lg checked-icon"></i>
                                        </div>
                                        <div
                                            class="quick-view-btn quick-view-btn-list w-[32px] h-[32px] flex items-center justify-center rounded-full bg-white duration-300 relative">
                                            <div class="tag-action bg-black text-white caption2 px-1.5 py-0.5 rounded-sm">
                                                Quick View</div>
                                            <i class="ph ph-eye text-lg"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `);
            }

            productList.append(productItem);
        });
    }

    // Function to render pagination buttons
    function renderPagination(products = []) {
        listPagination.html('');
        const productsToDisplay = products.length ? products : productsData;

        let totalPages = Math.ceil(productsToDisplay.length / productsPerPage);
        const maxVisiblePages = 3;

        let startPage = 1;
        let endPage = totalPages;

        if (products.length > (productsPerPage * 2) && currentPage < 3) {
            startPage = 1;
            endPage = 3;
        }

        if (totalPages <= 2) {
            startPage = 1;
            endPage = 2;
        }

        if (products.length <= productsPerPage) {
            listPagination.remove();
        }

        if (currentPage > Math.floor(maxVisiblePages / 2)) {
            startPage = currentPage - Math.floor(maxVisiblePages / 2);
            endPage = startPage + maxVisiblePages - 1;
            if (endPage > totalPages) {
                endPage = totalPages;
                startPage = endPage - maxVisiblePages + 1;
            }
        }

        if (currentPage > 2) {
            const startButton = $('<button>').text('<<');
            startButton.on('click', function() {
                currentPage = 1;
                renderProducts(currentPage, products);
                renderPagination(products);
                addEventToProductItem(products);
            });
            listPagination.append(startButton);

            const prevButton = $('<button>').text('<');
            prevButton.on('click', function() {
                currentPage--;
                renderProducts(currentPage, products);
                renderPagination(products);
                addEventToProductItem(products);
            });
            listPagination.append(prevButton);
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i >= 1) {
                const button = $('<button>').text(i);

                if (i === currentPage) {
                    button.addClass('active');
                }

                button.on('click', function() {
                    currentPage = i;
                    renderProducts(currentPage, products);
                    renderPagination(products);
                    addEventToProductItem(products);
                });
                listPagination.append(button);
            }
        }

        if (currentPage < totalPages - 1) {
            const nextButton = $('<button>').text('>');
            nextButton.on('click', function() {
                currentPage++;
                renderProducts(currentPage, products);
                renderPagination(products);
                addEventToProductItem(products);
            });
            listPagination.append(nextButton);

            const endButton = $('<button>').text('>>');
            endButton.on('click', function() {
                currentPage = totalPages;
                renderProducts(currentPage, products);
                renderPagination(products);
                addEventToProductItem(products);
            });
            listPagination.append(endButton);
        }
    }

    // Initial fetch of products
    if (productList.length) {
        fetchProducts();
    }
});

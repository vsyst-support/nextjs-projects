import Head from "next/head";
import Script from "next/script";
import { useEffect } from "react";

export default function HomePage() {
  useEffect(() => {
    const drawer = document.getElementById("drawer");
    const isPhone = typeof window !== "undefined" && window.innerWidth <= 480;

    if (isPhone) {
      document.body.classList.remove("drawer-open");
      if (drawer) drawer.classList.remove("open");
    } else {
      document.body.classList.add("drawer-open");
      if (drawer) drawer.classList.add("open");
    }

    return () => {
      document.body.classList.remove("drawer-open");
    };
  }, []);

  const handleToggleDrawer = () => {
    if (typeof window !== "undefined" && window.toggleDrawer) {
      window.toggleDrawer();
    }
  };

  const handleGoTags = () => {
    if (typeof window !== "undefined") {
      if (window.openTagsModal) {
        window.openTagsModal();
      } else {
        window.location.href = "/tags";
      }
    }
  };

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Clipboard App</title>
        <link rel="stylesheet" href="/style.css" />
        <style>{`
          /* Drawer styles now come from /style.css (light theme) */
        `}</style>
      </Head>

      <div id="drawer">
        <div className="drawer-header">
          <h3 className="h3">Filter Tags</h3>
          <button
            className="manage-tags-btn"
            title="Manage Tags"
            aria-label="Manage Tags"
            onClick={handleGoTags}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
            </svg>
          </button>
        </div>
        <div id="drawerFilterTags"></div>

        <button id="clearAllBtn" className="drawer-clear-btn">
          Clear All Filters
        </button>
      </div>

      <button id="drawerToggle" onClick={handleToggleDrawer}>
        &#9776;
      </button>

      <div className="container">
        <div className="page-header">
          <div className="header-left">
            <h1>Clipboard App</h1>
            <button id="addBtn" className="blue-btn" title="Add Clipboard" aria-label="Add Clipboard">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </svg>
            </button>
          </div>
          <div className="header-right">
            <div className="search-wrapper row_apart">
              <div id="activeTagFilters"></div>
              <div className="search-box">
                <input
                  id="searchInput"
                  placeholder="Search by title, text or tag..."
                />
                <span id="clearSearch">✖</span>
              </div>
              <div className="filter-block" style={{ marginLeft: 40 }}>
                <div className="date-row">
                  <label>
                    <span className="right">From</span>
                    <input type="date" id="startDate" />
                  </label>

                  <label>
                    <span className="right">To</span>
                    <input type="date" id="endDate" />
                  </label>
                </div>
              </div>
              <div className="filter-block">
                <div className="sort-by-label">Sort By</div>
                <select id="sortBy" defaultValue="date_desc">
                  <option value="date_desc">Newest</option>
                  <option value="date_asc">Oldest</option>
                  <option value="alpha_asc">A to Z</option>
                  <option value="alpha_desc">Z to A</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="top-actions"></div>

        <div id="clipboardsContainer"></div>
      </div>

      <div id="tagsModalOverlay" className="tags-modal-overlay" aria-hidden="true">
        <div className="tags-modal" role="dialog" aria-modal="true" aria-labelledby="tagsModalTitle">
          <div className="tags-modal-header">
            <h2 id="tagsModalTitle">Tags</h2>
            <button id="closeTagsModalBtn" className="tags-modal-close-btn" aria-label="Close tags modal">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
              </svg>
            </button>
          </div>
          <div className="tags-modal-divider"></div>
          <div className="tags-modal-body">
            <div className="tags-modal-form-row">
              <input id="tagsModalName" placeholder="Tag name" />
              <input id="tagsModalColor" type="color" defaultValue="#00c853" />
            </div>
            <div className="tags-modal-actions">
              <button id="tagsModalDeleteBtn" type="button">Delete</button>
              <button id="tagsModalSaveBtn" type="button">Save</button>
            </div>
          </div>
        </div>
      </div>

      <Script src="/script.js" strategy="afterInteractive" />
    </>
  );
}














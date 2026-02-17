import Head from "next/head";
import Script from "next/script";

export default function TagsPage() {
  const handleSaveTag = () => {
    if (typeof window !== "undefined" && window.saveTag) {
      window.saveTag();
    }
  };

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Manage Tags</title>
        <style>{`
          html,
          body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            font-family: Arial, sans-serif;
            background: #f0f4f8;
          }

          #backBtn {
            display: block;
            margin: 15px 0 0 20px;
            text-decoration: none;
            color: #2196f3;
            font-weight: bold;
          }

          .container {
            width: 100%;
            height: calc(100% - 50px);
            box-sizing: border-box;
            padding: 30px;
            background: #fff;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow-y: auto;
          }

          h2 {
            margin-bottom: 20px;
          }

          .tag-form {
            display: flex;
            gap: 10px;
            margin-bottom: 25px;
          }

          .tag-form input {
            padding: 10px 14px;
            border-radius: 14px;
            border: 1px solid #ccc;
            font-size: 14px;
          }

          .tag-form button {
            padding: 8px 18px;
            border-radius: 8px;
            border: none;
            background: #2196f3;
            color: #fff;
            cursor: pointer;
          }

          .tag-list {
            width: 100%;
            max-width: 600px;
          }

          .tag-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            margin-bottom: 10px;
            border-radius: 10px;
            background: #f9f9f9;
            border: 1px solid #ccc;
          }

          .tag-left {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .tag-pill {
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 13px;
            color: #fff;
          }

          .tag-actions button {
            margin-left: 6px;
            padding: 6px 12px;
            font-size: 12px;
            border-radius: 6px;
            cursor: pointer;
            background: transparent;
          }

          .edit-btn,
          .delete-btn,
          .save-edit-btn {
            background: transparent;
            border: 1.5px solid;
            padding: 6px 14px;
            border-radius: 8px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .edit-btn {
            border-color: #2196f3;
            color: #2196f3;
          }

          .delete-btn {
            border-color: #f44336;
            color: #f44336;
          }

          .save-edit-btn {
            border-color: #2196f3;
            color: #2196f3;
            font-weight: bold;
          }

          .edit-input {
            padding: 6px 10px;
            border-radius: 8px;
            border: 1px solid #ccc;
            font-size: 13px;
          }
        `}</style>
      </Head>

      <a id="backBtn" href="/">
        ← Back to Clipboard
      </a>

      <div className="container">
        <h2>Create Tag</h2>

        <div className="tag-form">
          <input id="name" placeholder="Tag name" />
          <input id="color" type="color" defaultValue="#4caf50" />
          <span
            id="colorPreview"
            style={{
              display: "inline-block",
              width: 20,
              height: 20,
              borderRadius: 4,
              border: "1px solid #ccc",
              marginLeft: 6,
              verticalAlign: "middle",
              background: "#4caf50",
            }}
          ></span>

          <button onClick={handleSaveTag}>Save</button>
        </div>

        <div className="tag-list" id="tagList"></div>
      </div>

      <Script src="/tags.js" strategy="afterInteractive" />
    </>
  );
}

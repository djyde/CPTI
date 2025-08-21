import { useState, useCallback } from "react";
import { useTranslations, type Lang } from "../i18n/ui";
import domtoimage from "dom-to-image";

interface ShareButtonsProps {
  lang?: Lang;
  personalityType: string;
  personalityName: string;
}

export default function ShareButtons({
  lang = "en",
  personalityType,
  personalityName,
}: ShareButtonsProps) {
  const [isGeneratingScreenshot, setIsGeneratingScreenshot] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const t = useTranslations(lang);

  const shareToX = useCallback(() => {
    // Open X compose window with text only
    const currentUrl = window.location.href;
    const text = t("share.xText", {
      type: personalityType,
      name: personalityName,
    });
    const xUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(
      text
    )}&url=${encodeURIComponent(currentUrl)}`;
    window.open(xUrl, "_blank", "width=550,height=420");
  }, [t, personalityType, personalityName]);

  const copyLink = useCallback(async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      // Failed to copy link
    }
  }, []);



  const generateScreenshotBlob = useCallback(async (): Promise<Blob | null> => {
    try {
      const mainContent = document.querySelector("main");
      if (!mainContent) {
        console.error("Main content area not found.");
        throw new Error("Main content area not found");
      }

      await document.fonts.ready; // Ensure all fonts are loaded

      const bodyBg = getComputedStyle(document.body).backgroundColor || "#ffffff";

      // Temporarily remove any box-shadow or outline from mainContent
      const originalBoxShadow = mainContent.style.boxShadow;
      const originalOutline = mainContent.style.outline;
      const originalPaddingBottom = mainContent.style.paddingBottom;
      mainContent.style.boxShadow = 'none';
      mainContent.style.outline = 'none';
      mainContent.style.paddingBottom = '0px';

      // Always capture the full main content first to ensure fidelity
      const fullBlob = await domtoimage.toBlob(mainContent as HTMLElement, {
        bgcolor: bodyBg,
        filter: (node: Node) => {
          if (!(node instanceof HTMLElement)) return true;
          return !node.classList.contains("share-buttons");
        },
      });

      // Restore original styles
      mainContent.style.boxShadow = originalBoxShadow;
      mainContent.style.outline = originalOutline;
      mainContent.style.paddingBottom = originalPaddingBottom;

      // Measure cutoff using live DOM rects
      const shareButtons = document.querySelector(".share-buttons");
      if (!shareButtons) {
        console.error("Share buttons not found for screenshot cutoff.");
        return fullBlob;
      }

      const mainRect = mainContent.getBoundingClientRect();
      const shareButtonsRect = shareButtons.getBoundingClientRect();

      // Calculate the height to crop to (from the top of main content to the top of share buttons)
      let cutoffHeight = shareButtonsRect.top - mainRect.top;
      // Slightly reduce cutoffHeight to remove any remaining border/margin
      cutoffHeight -= 5; // Adjust this value as needed

      // Create an Image object from the blob
      const img = new Image();
      img.src = URL.createObjectURL(fullBlob);

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = () => {
          console.error("Failed to load image for cropping.");
          resolve(null); // Resolve to continue even if image fails to load
        };
      });

      if (!img.naturalWidth || !img.naturalHeight) {
        console.error("Image dimensions are zero, cannot crop.");
        return fullBlob; // Fallback if image is invalid
      }

      // Create a canvas to draw the cropped image
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.error("Could not get 2D context for canvas.");
        return fullBlob; // Fallback if canvas context is not available
      }

      // Set canvas dimensions to the desired cropped area
      canvas.width = img.naturalWidth;
      canvas.height = Math.min(cutoffHeight, img.naturalHeight); // Ensure height doesn't exceed image natural height

      // Draw the image onto the canvas, cropping it
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

      // Convert the canvas content back to a blob
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            console.error("Failed to create cropped blob from canvas.");
            resolve(fullBlob); // Fallback to full blob on error
          }
          URL.revokeObjectURL(img.src); // Clean up the object URL
        }, "image/png");
      });
    } catch (error) {
      console.error("Screenshot generation error:", error);
      return null;
    }
  }, []);


  const downloadScreenshot = useCallback(async (blob: Blob) => {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `personality-type-screenshot-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Screenshot download error:", error);
      alert("Failed to download screenshot.");
    }
  }, []);

  const copyScreenshotToClipboard = useCallback(async () => {
    if (!navigator.clipboard) {
      alert("Clipboard API not supported in this browser.");
      return;
    }

    setIsGeneratingScreenshot(true);

    try {
      // Try clipboard first if supported
      const blob = await generateScreenshotBlob();

      if (!blob) {
        alert("Failed to generate screenshot. Please try again.");
        return;
      }

      try {
        // Attempt to write image to clipboard; if it fails we fallback to download
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);
      } catch (clipboardError) {
        // Clipboard failed, falling back to download for broader compatibility
        await downloadScreenshot(blob);
      }
    } catch (error) {
      console.error("Screenshot copy error:", error);
      alert("Failed to generate screenshot. Please try again.");
    } finally {
      setIsGeneratingScreenshot(false);
    }
  }, [generateScreenshotBlob, downloadScreenshot]);

  return (
    <div
      className="share-buttons flex flex-col items-center space-y-4 mt-12 pt-8"
    >
      <h3 className="text-sm text-flexoki-base-500/60 font-bold tracking-widest uppercase mb-4">
        {t("share.title")}
      </h3>

      <div className="flex flex-wrap justify-center gap-4">
        {/* X Share Button - Creates text tweet only */}
        <button
          onClick={shareToX}
          className="flex items-center gap-2 px-4 py-2 bg-flexoki-black text-flexoki-paper rounded-lg hover:bg-flexoki-base-800 transition-colors duration-200"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          {t("share.x")}
        </button>

        {/* Copy Screenshot Button - Only copies image to clipboard */}
        <button
          onClick={copyScreenshotToClipboard}
          disabled={isGeneratingScreenshot}
          data-screenshot-button
          className="flex items-center gap-2 px-4 py-2 bg-flexoki-blue-600 text-flexoki-paper rounded-lg hover:bg-flexoki-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          {isGeneratingScreenshot
            ? t("share.generating")
            : t("share.copyScreenshot")}
        </button>

        {/* Copy Link Button - Only copies current URL to clipboard */}
        <button
          onClick={copyLink}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
            linkCopied
              ? "bg-flexoki-base-600 text-flexoki-paper"
              : "bg-flexoki-green-600 text-flexoki-paper hover:bg-flexoki-green-700"
          }`}
        >
          {linkCopied ? (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          )}
          {linkCopied ? t("share.copied") : t("share.copyLink")}
        </button>
      </div>

      <p className="text-xs text-flexoki-base-400 text-center max-w-md">
        {t("share.description")}
      </p>
    </div>
  );
}

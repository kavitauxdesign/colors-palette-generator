import copyIconUrl from "../../../assets/copy.svg";
import deleteIconUrl from "../../../assets/delete.svg";
import editIconUrl from "../../../assets/edit.svg";
import magicWandIconUrl from "../../../assets/magic-wand.svg";
import regenerateIconUrl from "../../../assets/regenerate.svg";

export const AppAssetUrls = {
  icons: {
    regenerate: regenerateIconUrl,
    edit: editIconUrl,
    copy: copyIconUrl,
    delete: deleteIconUrl,
    magicWand: magicWandIconUrl,
  },
};

window.AppAssetUrls = AppAssetUrls;

export default AppAssetUrls;

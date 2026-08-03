/**
 * BlockSidebar — sidebar schema form for blocks that ship a custom `edit`.
 *
 * Volto only mounts `SidebarPortal` + `BlockDataForm` inside its own
 * `DefaultEdit` component (see
 * @plone/volto/components/manage/Blocks/Block/DefaultEdit). Registering a
 * custom `edit` in `blocksConfig` *replaces* `DefaultEdit`, which silently
 * takes the schema form with it — the block stays uneditable even though its
 * `blockSchema` is perfectly valid.
 *
 * Blocks whose edit mode is just a preview of the view should not register an
 * `edit` at all, so they fall back to `DefaultEdit` and get the sidebar for
 * free. This component exists for the minority that genuinely need custom edit
 * behaviour (a non-interactive preview, placeholder data, dimmed opacity) and
 * therefore cannot use that fallback: render it next to the preview and the
 * sidebar comes back.
 *
 * Mirrors DefaultEdit's wiring so behaviour stays identical: schemas may be a
 * plain object or a factory, and field changes are merged onto the existing
 * block data.
 */
import React from 'react';
import { useIntl } from 'react-intl';
import SidebarPortal from '@plone/volto/components/manage/Sidebar/SidebarPortal';
import { BlockDataForm } from '@plone/volto/components/manage/Form';

/** A block schema: either a literal object or a factory taking the edit props. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BlockSchema = Record<string, any>;
type BlockSchemaFactory =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props: Record<string, any>) => BlockSchema;

interface BlockSidebarProps {
  /** Schema object, or factory called with the edit props + intl. */
  schema: BlockSchema | BlockSchemaFactory;
  /** Block UID, passed through by Volto. */
  block?: string;
  /** Current block data. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: Record<string, any>;
  /** Whether the block is currently selected — gates the portal. */
  selected?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChangeBlock?: (block: string, data: Record<string, any>) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navRoot?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contentType?: any;
}

const BlockSidebar: React.FC<BlockSidebarProps> = (props) => {
  const {
    schema,
    block,
    data = {},
    selected,
    onChangeBlock,
    navRoot,
    contentType,
  } = props;
  const intl = useIntl();

  const resolvedSchema =
    typeof schema === 'function' ? schema({ ...props, intl }) : schema;

  if (!resolvedSchema) return null;

  return (
    <SidebarPortal selected={Boolean(selected)}>
      <BlockDataForm
        block={block}
        schema={resolvedSchema}
        title={resolvedSchema.title}
        onChangeField={(id: string, value: unknown) => {
          onChangeBlock?.(block as string, { ...data, [id]: value });
        }}
        onChangeBlock={onChangeBlock}
        formData={data}
        navRoot={navRoot}
        contentType={contentType}
      />
    </SidebarPortal>
  );
};

export default BlockSidebar;

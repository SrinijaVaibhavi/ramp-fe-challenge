import Downshift from "downshift";
import { useState, useEffect, useCallback } from "react";
import classNames from "classnames";
import { DropdownPosition, GetDropdownPositionFn, InputSelectOnChange, InputSelectProps } from "./types";

export function InputSelect<TItem>({
  label,
  defaultValue,
  onChange: consumerOnChange,
  items,
  parseItem,
  isLoading,
  loadingLabel,
}: InputSelectProps<TItem>) {
  const [selectedValue, setSelectedValue] = useState<TItem | null>(defaultValue ?? null);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0 });
  const [isOpen, setIsOpen] = useState(false);
  const [downshiftOpen, setDownshiftOpen] = useState(false); 

  const onChange = useCallback<InputSelectOnChange<TItem>>(
    (selectedItem) => {
      if (selectedItem === null) return;
      consumerOnChange(selectedItem);
      setSelectedValue(selectedItem);
    },
    [consumerOnChange]
  );

  useEffect(() => {
    setIsOpen(downshiftOpen);
  }, [downshiftOpen]);

  useEffect(() => {
    const updatePosition = () => {
      if (isOpen) {
        const dropdownElement = document.getElementById("RampSelect");
        if (dropdownElement) {
          setDropdownPosition(getDropdownPosition(dropdownElement));
        }
      }
    };

    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition); 

    return () => {
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  return (
    <Downshift<TItem>
      id="RampSelect"
      onChange={onChange}
      selectedItem={selectedValue}
      itemToString={(item) => (item ? parseItem(item).label : "")}
    >
      {({ getItemProps, getLabelProps, getMenuProps, isOpen: downshiftIsOpen, highlightedIndex, selectedItem, getToggleButtonProps, inputValue }) => {
        setDownshiftOpen(downshiftIsOpen);

        const toggleProps = getToggleButtonProps();
        const parsedSelectedItem = selectedItem === null ? null : parseItem(selectedItem);

        return (
          <div className="RampInputSelect--root" id="RampSelect">
            <label className="RampText--s RampText--hushed" {...getLabelProps()}>
              {label}
            </label>
            <div className="RampBreak--xs" />
            <div
              className="RampInputSelect--input"
              onClick={(event) => {
                setDropdownPosition(getDropdownPosition(event.target as HTMLElement));
                toggleProps.onClick(event);
              }}
            >
              {inputValue}
            </div>

            <div
              className={classNames("RampInputSelect--dropdown-container", {
                "RampInputSelect--dropdown-container-opened": isOpen,
              })}
              {...getMenuProps()}
              style={{ 
                position: "absolute",
                top: dropdownPosition.top, 
                left: dropdownPosition.left,
                width: "100%", 
                zIndex: 10 
              }}
            >
              {renderItems()}
            </div>
          </div>
        );

        function renderItems() {
          console.log('isLoading',isLoading, items)
          if (!isOpen) return null;
          if (isLoading) return <div className="RampInputSelect--dropdown-item">{loadingLabel}...</div>;
          if (items.length === 0) return <div className="RampInputSelect--dropdown-item">No items</div>;

          return items.map((item, index) => {
            const parsedItem = parseItem(item);
            return (
              <div
                key={parsedItem.value}
                {...getItemProps({
                  key: parsedItem.value,
                  index,
                  item,
                  className: classNames("RampInputSelect--dropdown-item", {
                    "RampInputSelect--dropdown-item-highlighted": highlightedIndex === index,
                    "RampInputSelect--dropdown-item-selected": parsedSelectedItem?.value === parsedItem.value,
                  }),
                })}
              >
                {parsedItem.label}
              </div>
            );
          });
        }
      }}
    </Downshift>
  );
}

const getDropdownPosition: GetDropdownPositionFn = (target) => {
  if (target instanceof Element) {
    const { top, left, height } = target.getBoundingClientRect();
    const { scrollY, scrollX } = window;
    return {
      top: scrollY + top + height,
      left: scrollX + left,
    };
  }
  return { top: 0, left: 0 };
};

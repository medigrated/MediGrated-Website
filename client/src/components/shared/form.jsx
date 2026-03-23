import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select } from "../ui/select";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Loader2 } from "lucide-react";

function SharedForm({ formControls, formData, setFormData, onSubmit, buttonText, hideButton, isBtnLoading }) {

    function renderInputsByComponentType(getControlItem) {
        let element = null;
        let value = formData[getControlItem.name];

        // Handle undefined values
        if (value === undefined) {
            value = getControlItem.componentType === 'checkbox' ? false : '';
        }

        switch (getControlItem.componentType) {
            case 'input':
                element = (
                    <Input
                        name={getControlItem.name}
                        type={getControlItem.type}
                        placeholder={getControlItem.placeholder}
                        id={getControlItem.name}
                        value={value}
                        autoComplete={getControlItem.autoComplete || "on"}
                        onChange={event => setFormData({
                            ...formData,
                            [getControlItem.name]: event.target.value
                        })}
                        className="w-full h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80 text-gray-900 dark:text-gray-100"
                    />
                );
                break;
            case 'select':
                element = (
                    <Select onValueChange={(value) => setFormData({ ...formData, [getControlItem.name]: value })} value={value} >
                        <SelectTrigger className="w-full h-10 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80 text-gray-900 dark:text-gray-100">
                            <SelectValue placeholder={getControlItem.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-white/20 dark:border-slate-800 text-gray-900 dark:text-gray-100">
                            {
                                getControlItem.options &&
                                    getControlItem.options.length > 0 ?
                                    getControlItem.options.map(optionItem => <SelectItem key={optionItem.value} value={optionItem.value} className="hover:bg-primary/10 dark:hover:bg-primary/20 cursor-pointer">{optionItem.label}</SelectItem>) : null
                            }

                        </SelectContent>
                    </Select>
                );
                break;

            case 'textarea':
                element = (
                    <Textarea
                        name={getControlItem.name}
                        placeholder={getControlItem.placeholder}
                        id={getControlItem.name}
                        value={value}
                        className="w-full min-h-[80px] px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80 resize-none text-gray-900 dark:text-gray-100"
                        onChange={event => setFormData({
                            ...formData,
                            [getControlItem.name]: event.target.value
                        })}
                    />
                );
                break;

            case 'checkbox':
                element = (
                    <div className="flex items-center space-x-3 mt-1 p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white/30 dark:bg-slate-800/30 hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                        <input
                            type="checkbox"
                            name={getControlItem.name}
                            id={getControlItem.name}
                            checked={value === true || value === 'true'}
                            onChange={event => setFormData({
                                ...formData,
                                [getControlItem.name]: event.target.checked
                            })}
                            className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary dark:border-slate-600 dark:bg-slate-900 cursor-pointer transition-all"
                        />
                        <Label htmlFor={getControlItem.name} className="text-sm font-medium leading-none cursor-pointer text-gray-700 dark:text-gray-200 select-none">
                            {getControlItem.checkboxLabel || 'Yes'}
                        </Label>
                    </div>
                );
                break;

            default:
                element = (
                    <Input
                        name={getControlItem.name}
                        type={getControlItem.type}
                        placeholder={getControlItem.placeholder}
                        id={getControlItem.name}
                        value={value}
                        autoComplete={getControlItem.autoComplete || "on"}
                        onChange={event => setFormData({
                            ...formData,
                            [getControlItem.name]: event.target.value
                        })}
                        className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-white/80 dark:hover:bg-slate-800/80 text-gray-900 dark:text-gray-100"
                    />
                );
                break;
        }
        return element;
    }

    const fields = (
        <div className="space-y-4">
            {
                formControls.map(controlItem => <div className="space-y-2" key={controlItem.name}>
                    <Label className="text-xs font-medium text-foreground dark:text-gray-300">{controlItem.label}</Label>
                    {
                        renderInputsByComponentType(controlItem)
                    }
                </div>)
            }
        </div>
    );

    // When hideButton is true, render fields only (no form wrapper, no button)
    // Parent is responsible for wrapping in <form> and adding its own buttons
    if (hideButton) {
        return fields;
    }

    // Default: wrap in form with submit button
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            {fields}
            <Button
                type="submit"
                disabled={isBtnLoading}
                className="w-full flex items-center justify-center gap-2 h-10 bg-gradient-primary hover:opacity-90 text-white font-semibold text-sm rounded-lg shadow-medium hover:shadow-large transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
            >
                {isBtnLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isBtnLoading ? "Please wait..." : (buttonText || "Submit")}
            </Button>
        </form>
    );
}

export default SharedForm;